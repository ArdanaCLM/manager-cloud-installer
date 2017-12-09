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
import { STATUS } from '../utils/constants.js';
import { ActionButton } from '../components/Buttons.js';
import io from 'socket.io-client';
import { List } from 'immutable';
import debounce from 'lodash/debounce';

const PROGRESS_UI_CLASS = {
  NOT_STARTED: 'notstarted',
  FAILED: 'fail',
  COMPLETE: 'succeed',
  IN_PROGRESS: 'progressing'
};

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
      displayedLogs: List(),         // log messages to display in the log viewer,
      commit: this.props.commitStatus
    };
  }

  getError() {
    if (this.state.errorMsg)
      return (<div>{translate('progress.failure')}<br/>
        <pre className='log'>{this.state.errorMsg}</pre></div>);
  }

  getStatusClass = (status) => {
    let retClass = '';
    switch (status) {
      case  STATUS.IN_PROGRESS:
        retClass = PROGRESS_UI_CLASS.IN_PROGRESS;
        break;
      case STATUS.COMPLETE:
        retClass = PROGRESS_UI_CLASS.COMPLETE;
        break;
      case STATUS.FAILED:
        retClass = PROGRESS_UI_CLASS.FAILED;
        break;
      default:
        retClass = PROGRESS_UI_CLASS.NOT_STARTED;
        break;
    }
    return retClass;
  }

  getCommitStatus() {
    if(this.state.commit !== undefined) {
      const stClass = this.getStatusClass(this.state.commit);
      return (<li key='commit' className={stClass}>{translate('deploy.progress.commit')}</li>);
    }
  }

  getProgress() {
    let progresses =  this.props.steps.map((step, index) => {
      let status = STATUS.NOT_STARTED, i = 0;

      //for each step, check if any playbooks failed
      for (i = 0; i < step.playbooks.length; i++) {
        if (this.state.playbooksError.indexOf(step.playbooks[i]) !== -1) {
          status = STATUS.FAILED ;//there is at least 1 ERROR playbook
        }
      }

      //check if all playbooks have finished
      if (status === STATUS.NOT_STARTED) {
        let complete = true;
        for (i = 0; i < step.playbooks.length; i++) {
          if(this.state.playbooksComplete.indexOf(step.playbooks[i]) === -1) {
            //at least one playbook is *not* complete
            complete = false;
          }
        }

        //if all playbooks were complete, set the status to succeed
        if (complete) {
          status = STATUS.COMPLETE;
        }
      }

      //if the status has not previously been set to fail or complete,
      // check if any of the playbooks have started
      if (status === STATUS.NOT_STARTED) {
        //for each step, check if all needed playbooks are done
        //if any are not done, check if at least 1 has started
        for (i = 0; i < step.playbooks.length; i++) {
          if (this.state.playbooksStarted.indexOf(step.playbooks[i]) !== -1) {
            status = STATUS.IN_PROGRESS;
            break;//theres at least 1 started playbook
          }
        }
      }

      const statusClass = this.getStatusClass(status);
      return (<li key={index} className={statusClass}>{step.label}</li>);
    });

    return progresses;
  }

  monitorSocket = (playbookName, playId) => {
    // Note that this function is only called after a fetch has completed, and thus
    // the application config has already completed loading, so getAppConfig can
    // be safely used here
    this.socket = io(getAppConfig('shimurl'));
    this.socket.on('playbook-start', this.playbookStarted);
    this.socket.on(
      'playbook-stop',
      (stepPlaybook) => { this.playbookStopped(stepPlaybook, playbookName, playId); });
    this.socket.on(
      'playbook-error',
      (stepPlaybook) => { this.playbookError(stepPlaybook, playbookName, playId); });
    this.socket.on('log', this.logMessage);
    this.socket.on(
      'end',
      () => { this.processEndMonitorPlaybook(playbookName); });
    this.socket.emit('join', playId);
  }

  findNextPlaybook = (completedPlaybookNames) => {
    let lastIndex = 0;
    // find which playbook is the last completed
    completedPlaybookNames.forEach((plyName) => {
      let theIndex = this.props.playbooks.findIndex((pName) => {
        return plyName === pName;
      });
      if (theIndex >= lastIndex) {
        lastIndex = theIndex;
      }
    });

    // if have more to go
    if (lastIndex + 1 < this.props.playbooks.length) {
      //return next playbook name
      console.log('found next to run ' + this.props.playbooks[lastIndex + 1]); //TODO remove
      return this.props.playbooks[lastIndex + 1];
    }
    //done, no more next playbook
    return;
  }

  processEndMonitorPlaybook = (playbookName) => {
    console.log('end of monitoring  ' + playbookName); //TODO remove
    this.socket.disconnect();
    const thisPlaybook = this.globalPlaybookStatus.find(e => e.name === playbookName);
    // the status should be updated when call playbookError or playbookStopped
    // already
    if(thisPlaybook && thisPlaybook.status === STATUS.COMPLETE) {
      let nextPlaybookName = this.findNextPlaybook([thisPlaybook.name]);
      if (nextPlaybookName) {
        this.launchPlaybook(nextPlaybookName);
      }
      else {
        this.props.updateStatus(STATUS.COMPLETE); //set the caller page status
      }
    }
  }

  updateGlobalPlaybookStatus = (playbookName, playId, status) => {
    const playbook = this.globalPlaybookStatus.find(e => e.name === playbookName);
    if (playbook) {
      if (playId && playId !== '') {
        playbook.playId = playId;
      }
      playbook.status = status;
      this.props.updateGlobalState('playbookStatus', this.globalPlaybookStatus);
    }
  }

  // To get or initializer this.globalPlaybookStatus from the saved state
  // playbookStatus
  getGlobalPlaybookStatus = () => {
    let retStatus = this.props.playbookStatus; //passed global in InstallWizards
    // don't have playbookStatus, initialize it based on current playbooks
    if (!retStatus) {
      retStatus = this.props.playbooks.map((playbookName) => {
        return {name: playbookName, status: undefined, playId: undefined};
      });
    }
    else { //have playbook status
      let exitStatus = retStatus.find((play) => this.props.playbooks.includes(play.name));
      if (!exitStatus) {
        //need init for this.props.playbooks
        let initPlayStatus = this.props.playbooks.map((playbookName) => {
          return {name: playbookName, status: undefined, playId: undefined};
        });
        retStatus = retStatus.concat(initPlayStatus);
      }
    }
    return retStatus;
  }

  // summarize playbook processes status before processing
  sumPlaybookProcessStatus = () => {
    let retStatus = {in_progress: undefined, complete: [], failed: []};
    this.globalPlaybookStatus.forEach((play) => {
      if (this.props.playbooks.indexOf(play.name) !== -1) {
        if (play.playId && play.status === STATUS.COMPLETE) {
          retStatus.complete.push(play);
        }
        else if (play.playId && play.status === STATUS.IN_PROGRESS) {
          //should be just one in progress
          retStatus.in_progress = play;
        }
        else if (play.playId && play.status === STATUS.FAILED) {
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
        this.setState({commit: STATUS.COMPLETE});
        // update global commitStatus state
        this.props.updateGlobalState('commitStatus', STATUS.COMPLETE);
      })
      .catch((error) => {
        this.setState({errorMsg: translate('deploy.commit.failure', error.toString())});
        // set caller page status
        this.props.updateStatus(STATUS.FAILED);
        // update commit step status
        this.setState({commit: STATUS.FAILED});
        // update global commitStatus state
        this.props.updateGlobalState('commitStatus', STATUS.FAILED);
      });
  }

  processAlreadyDonePlaybook = (playbook, status) => {
    // The play has already ended, and is either complete or failed
    // update page status
    this.props.updateStatus(status);

    // go get logs
    fetchJson('/api/v1/clm/plays/' + playbook.playId + '/log')
      .then(response => {
        const message = response.trimRight('\n');
        this.logsReceived = List(message);
        this.setState((prevState) => {
          return {displayedLogs: prevState.displayedLogs.concat(this.logsReceived)}; });
      });

    // update the UI status
    fetchJson('/api/v1/clm/plays/' + playbook.playId + '/events')
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

  processPlaybooks = () => {
    let playStatus = this.sumPlaybookProcessStatus();
    let progressPlay = playStatus.in_progress;
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
      fetchJson('/api/v1/clm/plays/' + progressPlay.playId, {
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
            // continue if everything is fine
            if (status === STATUS.COMPLETE) {
              let nextPlaybookName = this.findNextPlaybook([progressPlay.name]);
              if(nextPlaybookName) {
                this.launchPlaybook(nextPlaybookName);
              }
            }
          }
          else {
            // The play is still in progress
            this.props.updateStatus(progressPlay, STATUS.IN_PROGRESS);
            this.monitorSocket(progressPlay.name, progressPlay.playId);
          }
        })
        .catch((error) => {
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
          // go for logs for completed
          let bookNames = [];
          completePlaybooks.forEach((book) => {
            this.processAlreadyDonePlaybook(book, STATUS.COMPLETE);
            bookNames.push(book.name);
          });
          let nextPlaybookName = this.findNextPlaybook(bookNames);
          // if have more to run
          if (nextPlaybookName) {
            this.launchPlaybook(nextPlaybookName);
          }
        }
      }
      else {//don't have any inprogress, failed or complete books , very fresh start
        if(this.state.commit !== undefined) {
          if(this.state.commit === STATUS.NOT_STARTED) {
            this.commitChanges().then(() => {
              //do not launch playbook if we can not commit
              if (this.state.commit === STATUS.COMPLETE) {
                this.launchPlaybook(this.props.playbooks[0]);
              }
            });
          }
          else if (this.state.commit === STATUS.COMPLETE) {
            // recorded commit succeeded, but haven't start anything yet
            this.launchPlaybook(this.props.playbooks[0]);
          }
          else { //recorded commit failed, try to recommit
            this.commitChanges().then(() => {
              //do not launch playbook if we can not commit
              if (this.state.commit === STATUS.COMPLETE) {
                this.launchPlaybook(this.props.playbooks[0]);
              }
            });
          }
        }
        else { //don't need to commit change, just launch first playbook, for example install
          this.launchPlaybook(this.props.playbooks[0]);
        }
      }
    }
  }

  launchPlaybook = (playbookName) => {
    postJson('/api/v1/clm/playbooks/' + playbookName,
      JSON.stringify(this.props.payload || ''))
      .then(response => {
        const playId = response['id'];
        this.monitorSocket(playbookName, playId);
        // update local this.globalPlaybookStatus and also update global state playbookSatus
        this.updateGlobalPlaybookStatus(playbookName, playId, STATUS.IN_PROGRESS);
        // overall status for caller page
        this.props.updateStatus(STATUS.IN_PROGRESS);
        console.log('launch ' + playbookName); //TODO remove
      })
      .catch((error) => {
        console.log('failed to launch ' + playbookName); //TODO remove
        // overall status for caller, if failed, just stop
        this.props.updateStatus(STATUS.FAILED);
        // update local this.globalPlaybookStatus and also update global state playbookSatus
        this.updateGlobalPlaybookStatus(playbookName, '', STATUS.FAILED);
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
            <ul>{this.getCommitStatus()}{this.getProgress()}</ul>
            <div>
              {!this.state.errorMsg && !this.state.showLog && this.renderShowLogButton()}
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
    console.log(JSON.stringify(this.props.playbooks));
    console.log(JSON.stringify(this.props.deployConfig));
    console.log(JSON.stringify(this.props.payload));
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
    console.log(' step playbook started ' + stepPlaybook);

    this.setState((prevState) => {
      return {'playbooksStarted': prevState.playbooksStarted.concat(stepPlaybook)};
    });
  }

  /**
   * callback for when a playbook finishes, the UI component will track which
   * playbooks out of the needed set have started/finished to show status
   * to the user
   *
   * @param stepPlaybook
   * @param playbookName
   * @param playId
   */
  playbookStopped = (stepPlaybook, playbookName, playId) => {
    console.log(' step playbook stopped ' + stepPlaybook);

    let complete = false;

    this.setState((prevState) => {
      const completedPlaybooks = prevState.playbooksComplete.concat(stepPlaybook);
      complete = completedPlaybooks.includes(playbookName + '.yml');
      return {'playbooksComplete': completedPlaybooks};
    });
    if (complete) {
      if(playbookName) {
        console.log(' playbook completed ' + playbookName);
        this.updateGlobalPlaybookStatus(playbookName, playId, STATUS.COMPLETE);
      }
    }
  }

  /**
   * callback for when a playbook finishes, the UI component will track which
   * playbooks out of the needed set have started/finished to show status
   * to the user
   *
   * @param stepPlaybook
   * @param playbookName
   * @param playId
   */
  playbookError = (stepPlaybook, playbookName, playId) => {
    let failed = false;

    console.log(' step playbook failed ' + stepPlaybook);

    this.setState((prevState) => {
      const errorPlaybooks = prevState.playbooksError.concat(stepPlaybook);
      failed = errorPlaybooks.includes(playbookName + '.yml');
      return {'playbooksError': errorPlaybooks};
    });

    if (failed) {
      if(playbookName) {
        console.log(' playbook failed ' + playbookName);
        this.updateGlobalPlaybookStatus(playbookName, playId, STATUS.FAILED);
      }
      // if failed update caller page immediately
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
