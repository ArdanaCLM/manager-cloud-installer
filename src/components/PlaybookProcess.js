// (c) Copyright 2017 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import { fetchJson, postJson } from '../utils/RestUtils.js';
import { STATUS , PLAYBOOK_PROGRESS_UI_STATUS } from '../utils/constants.js';
import { ActionButton } from '../components/Buttons.js';
import io from 'socket.io-client';
import { List } from 'immutable';
import debounce from 'lodash/debounce';

class LogViewer extends Component {

  constructor(props) {
    super(props);

    this.state = {
      autoScroll: true
    };
  }

  componentDidUpdate(prevProps, prevState) {
    // Scroll to the bottom whenever the component updates
    if (prevState.autoScroll) {
      this.viewer.scrollTop = this.viewer.scrollHeight - this.viewer.clientHeight;
    }
  }

  handleChange = (e) => {
    this.setState({autoScroll: e.target.checked});
  }

  render() {
    return (
      <div>
        <div className="log-viewer">
          <pre className="rounded-corner" ref={(comp) => {this.viewer = comp; }}>
            {this.props.contents.join('')}
          </pre>
        </div>
        <div className='log-viewer-control'>
          <label className='log-viewer-scroll'>
            <input type="checkbox"
              checked={this.state.autoScroll}
              onChange={this.handleChange} /> {translate('logviewer.autoscroll')}
          </label>
          <div className='log-viewer-hide'>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

class PlaybookProgress extends Component {
  constructor(props) {
    super(props);

    // List for capturing messages as they are received.  The state
    // variable will be updated regularly with the contents of this
    // list.
    this.logsReceived = List();

    this.state = {
      errorMsg: '',                  // error message to display
      showLog: false,                // controls visibility of log viewer
      playbooksStarted: [],          // list of playbooks that have started
      playbooksComplete: [],         // list of playbooks that have completed
      playbooksError: [],            // list of playbooks that have errored
      displayedLogs: List(),        // log messages to display in the log viewer,
      commit: this.props.commitStatus ? this.props.commitStatus: undefined
    };
  }

  getError() {
    if (this.state.errorMsg)
      return (<div>{translate('progress.failure')}<br/>
        <pre className='log'>{this.state.errorMsg}</pre></div>);
  }

  getCommitStatus() {
    return (<li key='commit' className={this.state.commit}>{translate('deploy.progress.commit')}</li>);
  }

  getProgress() {
    return this.props.steps.map((step, index) => {
      var status = PLAYBOOK_PROGRESS_UI_STATUS.NOTSTARTED, i = 0;

      //for each step, check if any playbooks failed
      for(i = 0; i < step.playbooks.length; i++) {
        if (this.state.playbooksError.indexOf(step.playbooks[i]) !== -1) {
          status = PLAYBOOK_PROGRESS_UI_STATUS.FAIL;//theres at least 1 ERROR playbook
        }
      }

      //check if all playbooks have finished
      if(status === PLAYBOOK_PROGRESS_UI_STATUS.NOTSTARTED) {
        let complete = true;
        for (i = 0; i < step.playbooks.length; i++) {
          if(this.state.playbooksComplete.indexOf(step.playbooks[i]) === -1) {
            //at least one playbook is *not* complete
            complete = false;
          }
        }

        //if all playbooks were complete, set the status to succeed
        if(complete) {
          status = PLAYBOOK_PROGRESS_UI_STATUS.SUCCEED;
        }
      }

      //if the status has not previously been set to fail or complete,
      // check if any of the playbooks have started
      if(status === PLAYBOOK_PROGRESS_UI_STATUS.NOTSTARTED) {
        //for each step, check if all needed playbooks are done
        //if any are not done, check if at least 1 has started
        for (i = 0; i < step.playbooks.length; i++) {
          if (this.state.playbooksStarted.indexOf(step.playbooks[i]) !== -1) {
            status = PLAYBOOK_PROGRESS_UI_STATUS.PROCESSING;
            break;//theres at least 1 started playbook
          }
        }
      }

      return (<li key={index} className={status}>{step.label}</li>);
    });
  }

  monitorSocket = (playbookName, playId, orderIndex) => {
    // Note that this function is only called after a fetch has completed, and thus
    // the application config has already completed loading, so getAppConfig can
    // be safely used here
    this.socket = io(getAppConfig('shimurl'));
    this.socket.on('playbook-start', this.playbookStarted);
    this.socket.on(
      'playbook-stop',
      (stepPlaybook) => { this.playbookStopped(stepPlaybook, playbookName, playId, orderIndex); });
    this.socket.on(
      'playbook-error',
      (stepPlaybook) => { this.playbookError(stepPlaybook, playbookName, playId, orderIndex); });
    this.socket.on('log', this.logMessage);
    this.socket.on(
      'end',
      () => { this.processEndMonitorPlaybook(playbookName, playId, orderIndex); });
    this.socket.emit('join', playId);
  }

  processEndMonitorPlaybook = (playbookName, playId, orderIndex) => {
    this.socket.disconnect();
    let plybk = this.globalPlaybookStatus.find((playbook) => {
      if(playbook.name === playbookName && playbook.idx === orderIndex) {
        return playbook;
      }
    });
    // the status should be updated when call playbookError or playbookStopped
    // already
    if(plybk && plybk.status === STATUS.COMPLETE) {
      if (!this.isAllPlaybookDone(orderIndex)) {
        let nextIndex = orderIndex + 1;
        this.launchPlaybook(this.props.playbooks[nextIndex], nextIndex);
      }
    }
  }

  updateGlobalPlaybookStatus = (playbookName, id, orderIndex, status) => {
    let playbook = this.globalPlaybookStatus.find((playbook) => {
      if(playbook.name === playbookName && playbook.idx === orderIndex) {
        return playbook;
      }
    });
    if(playbook) {
      if(id && id !== '') {
        playbook.id = id;
      }
      playbook.status = status;
    }
    this.props.updateGlobalState('playbookStatus', this.globalPlaybookStatus);
  }

  // To get or initializer this.globalPlaybookStatus from the saved state
  // playbookStatus
  getGlobalPlaybookStatus = () => {
    let retStatus = this.props.playbookStatus; //passed global in InstallWizards
    // don't have playbookStatus, initialize it based on current playbooks
    if (!retStatus) {
      retStatus = this.props.playbooks.map((playbook, idx) => {
        return {name: playbook, status: undefined, id: undefined, idx: idx};
      });
    }
    else { //have playbook status
      let exitStatus = retStatus.find((play) => {
        return this.props.playbooks.includes(play.name);
      });
      if(!exitStatus) {
        //need init for this.props.playbooks
        let initPlayStatus = this.props.playbooks.map((playbook, idx) => {
          return {name: playbook, status: undefined, id: undefined, idx: idx};
        });
        retStatus = retStatus.concat(initPlayStatus);
      }
    }
    return retStatus;
  }

  // get the summarized playbook processes status before processing
  getPlaybookProcessStatus = () => {
    let retStatus = {inprogress: undefined, complete: [], failed: []};
    this.globalPlaybookStatus.forEach((play) => {
      if(this.props.playbooks.indexOf(play.name) !== -1) {
        if (play.id && play.status === STATUS.COMPLETE) {
          retStatus.complete.push(play);
        }
        else if (play.id && play.status === STATUS.IN_PROGRESS) {
          //should be just one in progress
          retStatus.inprogress = play;
        }
        else if (play.id && play.status === STATUS.FAILED) {
          retStatus.failed.push(play);
        }
      }
    });
    return retStatus;
  }

  commitChanges = () => {
    //commit before launchPlayBook
    const commitMessage = {'message': 'Committed via Ardana DayZero Installer'};
    return postJson('/api/v1/clm/model/commit', commitMessage)
      .then((response) => {
        // update commit step status
        this.setState({commit: PLAYBOOK_PROGRESS_UI_STATUS.SUCCEED});
        // update global commitStatus state
        this.props.updateGlobalState('commitStatus', PLAYBOOK_PROGRESS_UI_STATUS.SUCCEED);
      })
      .catch((error) => {
        this.setState({errorMsg: translate('deploy.commit.failure', error.toString())});
        // set caller page status
        this.props.updateStatus(STATUS.FAILED);
        // update commit step status
        this.setState({commit: PLAYBOOK_PROGRESS_UI_STATUS.FAIL});
        // update global commitStatus state
        this.props.updateGlobalState('commitStatus', PLAYBOOK_PROGRESS_UI_STATUS.FAIL);
      });
  }

  processAlreadyDonePlaybook = (playbook, status) => {
    // The play has already ended, and is either complete or failed
    // update page status
    this.props.updateStatus(status);

    // go get logs
    fetchJson('/api/v1/clm/plays/' + playbook.id + '/log')
      .then(response => {
        const message = response.trimRight('\n');
        this.logsReceived = List(message);
        ////TODO gloria need contact?
        this.setState({displayedLogs: this.logsReceived});
      });

    // update the UI status
    fetchJson('/api/v1/clm/plays/' + playbook.id + '/events')
      .then(response => {
        for (let evt of response) {
          if (evt.event === 'playbook-stop')
            this.playbookStopped(evt.playbook);
          else if (evt.event === 'playbook-start')
            this.playbookStarted(evt.playbook);
          else if (evt.event === 'playbook-error')
            this.playbookError(evt.playbook);
        }
      });
  }

  isAllPlaybookDone = (currentIdx) => {
    return this.props.playbooks.length === currentIdx + 1;
  }

  processPlaybooks = () => {
    let playStatus = this.getPlaybookProcessStatus();
    let progressPlay = playStatus.inprogress;
    let completePlaybooks = playStatus.complete;
    let failedPlaybooks = playStatus.failed;

    // if have last recorded in progress
    if (progressPlay) {
      // if have completes, process completed log
      if(completePlaybooks.length > 0) {
        completePlaybooks.forEach((book) => {
          this.processAlreadyDonePlaybook(book, STATUS.COMPLETE);
        });
      }

      //check in progress one
      fetchJson('/api/v1/clm/plays/' + progressPlay.id, {
        // Note: Use no-cache in order to get an up-to-date response
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      })
        .then(response => {
          if ('endTime' in response) {
            let status = (response['code'] == 0 ? STATUS.COMPLETE : STATUS.FAILED);
            this.processAlreadyDonePlaybook(progressPlay, status);
            if (!this.isAllPlaybookDone(progressPlay.idx)) {
              // continue if everything is fine
              if (status === STATUS.COMPLETE) {
                let nextIndex = progressPlay.idx + 1;
                this.launchPlaybook(this.props.playbooks[nextIndex], nextIndex);
              }
            }
          }
          else {
            // The play is still in progress
            this.props.updateStatus(progressPlay, STATUS.IN_PROGRESS);
            this.monitorSocket(progressPlay.name, progressPlay.id, progressPlay.idx);
          }
        })
        .catch((error) => {
          //TODO what to do here?
          this.setState({errorMsg: error.message});
        });
    }
    else { //don't have inprogress playbook
      //recorded either have completes or failed playbooks or never started
      if(completePlaybooks.length > 0 || failedPlaybooks.length > 0) {
        // if have failed, don't continue run playbook at all
        // only go for logs
        if (failedPlaybooks.length > 0) {
          failedPlaybooks.forEach((book) => {
            this.processAlreadyDonePlaybook(book, STATUS.FAILED);
          });
          // also go for the logs for completed
          if (completePlaybooks.length > 0) {
            completePlaybooks.forEach((book) => {
              this.processAlreadyDonePlaybook(book, STATUS.COMPLETE);
            });
          }
        }
        else { //don't have failed, just have complete books
          let lastIndex = 0;
          // go for logs for completed
          completePlaybooks.forEach((book) => {
            this.processAlreadyDonePlaybook(book, STATUS.COMPLETE);
            if (book.idx >= lastIndex) {
              lastIndex = book.idx;
            }
          });
          // if have more to run
          if (!this.isAllPlaybookDone(lastIndex)) {
            let nextIndex = lastIndex + 1;
            this.launchPlaybook(this.props.playbooks[nextIndex], nextIndex);
          }
        }
      }
      else {//don't have any inprogress, failed or complete books , very fresh start
        if(this.state.commit) {
          if(this.state.commit === PLAYBOOK_PROGRESS_UI_STATUS.NOTSTARTED) {
            this.commitChanges().then(() => {
              //do not launch playbook if we can not commit
              if (this.state.commit === PLAYBOOK_PROGRESS_UI_STATUS.SUCCEED) {
                //this.launchPlaybook(this.props.playbooks[0], 0);
                console.log('finish commit start playbook ');
              }
            });
          }
          else if (this.state.commit === PLAYBOOK_PROGRESS_UI_STATUS.SUCCEED) {
            // recorded commit succeeded, but haven't start anything yet
            //this.launchPlaybook(this.props.playbooks[0], 0);
            console.log('finish last time commit start playbook ');
          }
          else { //recorded commit failed, try to recommit?
            this.commitChanges().then(() => {
              //do not launch playbook if we can not commit
              if (this.state.commit === PLAYBOOK_PROGRESS_UI_STATUS.SUCCEED) {
                //this.launchPlaybook(this.props.playbooks[0], 0);
                console.log('finish re-commit start playbook ');
              }
            });
          }
        }
        else { //don't need to commit change, just launch playbooks, for example install
          this.launchPlaybook(this.props.playbooks[0], 0);
        }
      }
    }
  }

  launchPlaybook = (playbookName, indexOrder) => {
    postJson('/api/v1/clm/playbooks/' + playbookName,
      JSON.stringify(this.props.payload || ''))
      .then(response => {
        const playId = response['id'];
        this.monitorSocket(playbookName, playId, indexOrder);
        // update local this.globalPlaybookStatus and also update global state playbookSatus
        this.updateGlobalPlaybookStatus(playbookName, playId, indexOrder, STATUS.IN_PROGRESS);
        // overall status for caller page
        this.props.updateStatus(STATUS.IN_PROGRESS);
      })
      .catch((error) => {
        // overall status for caller, if failed, just stop
        this.props.updateStatus(STATUS.FAILED);
        // update local this.globalPlaybookStatus and also update global state playbookSatus
        this.updateGlobalPlaybookStatus(playbookName, '', indexOrder, STATUS.FAILED);
        this.setState({errorMsg: List(error.message)});
      });
  }

  renderShowLogButton() {
    const logButtonLabel = translate('progress.show.log');

    return (
      <ActionButton type='link'
        displayLabel={logButtonLabel}
        clickAction={() => this.setState((prev) => { return {'showLog': !prev.showLog}; }) } />
    );
  }

  renderLogViewer() {
    const logButtonLabel = translate('progress.hide.log');
    return (
      <LogViewer contents={this.state.displayedLogs}>
        <ActionButton type='link'
          displayLabel={logButtonLabel}
          clickAction={() => this.setState((prev) => { return {'showLog': !prev.showLog}; }) } />
      </LogViewer>
    );
  }

  render() {
    return (
      <div className='playbook-progress'>
        <div className='progress-body'>
          <div className='col-xs-4'>
            <ul>{this.state.commit && this.getCommitStatus()}{this.getProgress()}</ul>
            <div>
              {!this.state.showLog && this.renderShowLogButton()}
            </div>
          </div>
          <div className='col-xs-8'>
            {this.getError()}
            {this.state.showLog && this.renderLogViewer()}
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.globalPlaybookStatus = this.getGlobalPlaybookStatus();
    this.processPlaybooks();
  }

  componentWillUnmount() {

    // Disconnect from the socket to avoid receiving any further log messages
    if (this.socket) {
      this.socket.disconnect();
    }

    // Cancel any pending setState, which otherwise may generate reactjs errors about
    // calling setState on an unmounted component
    this.updateState.cancel();
  }

  /**
   * callback for when a playbook starts, the UI component will track which
   * playbooks out of the needed set have started/finished to show status
   * to the user
   * @param {String} the playbook filename
   */
  playbookStarted = (stepPlaybook) => {
    this.setState((prevState) => {
      return {'playbooksStarted': prevState.playbooksStarted.concat(stepPlaybook)};
    });
  }

  /**
   * callback for when a playbook finishes, the UI component will track which
   * playbooks out of the needed set have started/finished to show status
   * to the user
   * @param {String} the playbook filename
   */
  playbookStopped = (stepPlaybook, playbookName, playId, orderIndex) => {
    let complete = false;

    this.setState((prevState) => {
      const completedPlaybooks = prevState.playbooksComplete.concat(stepPlaybook);
      complete = completedPlaybooks.includes(this.props.playbooks[orderIndex] + '.yml');
      return {'playbooksComplete': completedPlaybooks};
    });
    if (complete) {
      if(playbookName) {
        this.updateGlobalPlaybookStatus(playbookName, playId, orderIndex, STATUS.COMPLETE);
      }
      this.props.updateStatus(STATUS.COMPLETE);
    }
  }

  /**
   * callback for when a playbook finishes, the UI component will track which
   * playbooks out of the needed set have started/finished to show status
   * to the user
   * @param {String} the playbook filename
   */
  playbookError = (stepPlaybook, playbookName, playId, orderIndex) => {
    let failed = false;

    this.setState((prevState) => {
      const errorPlaybooks = prevState.playbooksError.concat(stepPlaybook);
      failed = errorPlaybooks.includes(this.props.playbooks[orderIndex]+'.yml');
      return {'playbooksError': errorPlaybooks};
    });

    if (failed) {
      if(playbookName) {
        this.updateGlobalPlaybookStatus(playbookName, playId, orderIndex, STATUS.FAILED);
      }
      this.props.updateStatus(STATUS.FAILED);
    }
  }

  logMessage = (message) => {
    this.logsReceived = this.logsReceived.push(message);
    this.updateState(this.logsReceived);
  }

  // Update the state.  Uses lodash.debounce to avoid getting inunadated by fast logs,
  // by avoiding repeated calls within a short amount of time
  updateState = debounce((data) => {
    this.setState({displayedLogs: data});
  }, 100)
}

export { PlaybookProgress };
