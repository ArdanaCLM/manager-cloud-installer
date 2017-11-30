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
      commit: 'notstarted',          // keep track of the commit

      displayedLogs: List()          // log messages to display in the log viewer
    };

    this.startPlaybook();
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
      var status = 'notstarted', i = 0;

      //for each step, check if any playbooks failed
      for(i = 0; i < step.playbooks.length; i++) {
        if (this.state.playbooksError.indexOf(step.playbooks[i]) !== -1) {
          status = 'fail';//theres at least 1 ERROR playbook
        }
      }

      //check if all playbooks have finished
      if(status === 'notstarted') {
        let complete = true;
        for (i = 0; i < step.playbooks.length; i++) {
          if(this.state.playbooksComplete.indexOf(step.playbooks[i]) === -1) {
            //at least one playbook is *not* complete
            complete = false;
          }
        }

        //if all playbooks were complete, set the status to succeed
        if(complete) {
          status = 'succeed';
        }
      }

      //if the status has not previously been set to fail or complete,
      // check if any of the playbooks have started
      if(status === 'notstarted') {
        //for each step, check if all needed playbooks are done
        //if any are not done, check if at least 1 has started
        for (i = 0; i < step.playbooks.length; i++) {
          if (this.state.playbooksStarted.indexOf(step.playbooks[i]) !== -1) {
            status = 'progressing';
            break;//theres at least 1 started playbook
          }
        }
      }

      return (<li key={index} className={status}>{step.label}</li>);
    });
  }

  monitorSocket = (playId) => {
    // Note that this function is only called after a fetch has completed, and thus
    // the application config has already completed loading, so getAppConfig can
    // be safely used here
    this.socket = io(getAppConfig('shimurl'));
    this.socket.on('playbook-start', this.playbookStarted);
    this.socket.on('playbook-stop', this.playbookStopped);
    this.socket.on('playbook-error', this.playbookError);
    this.socket.on('log', this.logMessage);
    this.socket.on('end', () => { this.socket.disconnect(); });
    this.socket.emit('join', playId);
  }

  startPlaybook = () => {
    // Start the playbook if it has not already been done.  overallStatus will be set
    // initially here.  If the playbook is launched, further updates to the status will
    // be performed as playbook events arrive from the ardana service (which originate
    // in the ansible playbooks)

    if (this.props.playId) {
      // Get the output of the play that has already been launched

      fetchJson('/api/v1/clm/plays/' + this.props.playId, {
        // Note: Use no-cache in order to get an up-to-date response
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      })
        .then(response => {
          if ('endTime' in response) {
            // The play has already ended, and is either complete or failed
            this.props.updateStatus(response['code'] == 0 ? STATUS.COMPLETE : STATUS.FAILED);

            fetchJson('/api/v1/clm/plays/' + this.props.playId + '/log')
              .then(response => {
                const message = response.trimRight('\n');
                this.logsReceived = List(message);
                this.setState({displayedLogs: this.logsReceived});
              });

            fetchJson('/api/v1/clm/plays/' + this.props.playId + '/events')
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
          } else {
            // The play is still in progress
            this.props.updateStatus(STATUS.IN_PROGRESS);
            this.monitorSocket(this.props.playId);
          }
        })
        .catch((error) => {
          this.setState({errorMsg: error.message});
        });

    } else {
      //commit before launchPlayBook
      const commitMessage = {'message': 'Committed via Ardana DayZero Installer'};
      postJson('/api/v1/clm/model/commit', commitMessage)
        .then((response) => {
          this.setState({commit: 'succeed'});
          this.launchPlaybook();
        })
        .catch((error) => {
          this.setState({errorMsg: translate('deploy.commit.failure', error.toString())});
          this.props.updateStatus(STATUS.FAILED);
          this.setState({commit: 'fail'});
        });
    }
  };

  launchPlaybook = () => {
    postJson('/api/v1/clm/playbooks/' + this.props.playbook,
      JSON.stringify(this.props.payload || ''))
      .then(response => {
        const playId = response['id'];
        this.monitorSocket(playId);
        this.props.updateStatus(STATUS.IN_PROGRESS);
        this.props.updatePlayId(playId);
      })
      .catch((error) => {
        this.props.updateStatus(STATUS.FAILED);
        this.setState({errorMsg: List(error.message)});
      });
  }

  renderShowLogButton() {
    const logButtonLabel = translate('progress.show.log');
    if (this.props.playId || this.state.contents) {
      return (
        <ActionButton type='link'
          displayLabel={logButtonLabel}
          clickAction={() => this.setState((prev) => { return {'showLog': !prev.showLog}; }) } />
      );
    }
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
  playbookStarted = (playbook) => {
    this.setState((prevState) => {
      return {'playbooksStarted': prevState.playbooksStarted.concat(playbook)};
    });
  }

  /**
   * callback for when a playbook finishes, the UI component will track which
   * playbooks out of the needed set have started/finished to show status
   * to the user
   * @param {String} the playbook filename
   */
  playbookStopped = (playbook) => {
    let complete = false;

    this.setState((prevState) => {
      const completedPlaybooks = prevState.playbooksComplete.concat(playbook);
      complete = completedPlaybooks.includes(this.props.playbook+'.yml');
      return {'playbooksComplete': completedPlaybooks};
    });
    if (complete) {
      this.props.updateStatus(STATUS.COMPLETE);
    }
  }

  /**
   * callback for when a playbook finishes, the UI component will track which
   * playbooks out of the needed set have started/finished to show status
   * to the user
   * @param {String} the playbook filename
   */
  playbookError = (playbook) => {
    let failed = false;

    this.setState((prevState) => {
      const errorPlaybooks = prevState.playbooksError.concat(playbook);
      failed = errorPlaybooks.includes(this.props.playbook+'.yml');
      return {'playbooksError': errorPlaybooks};
    });

    if (failed) {
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
