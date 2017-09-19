import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import { ActionButton } from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';
import io from 'socket.io-client';
import { List } from 'immutable';
import debounce from 'lodash/debounce';


// Rules to enforce:
// - while the playbook is running (or unknown), Back and Next should be disallowed
// - if the playbook ended successfully, only Next should be allowed
// - if the playbook failed, only Back should be allowed

// How to determine these for a new session?  For an existing session

// For a new session, query the ardana for the play, and look in
//  the results to see which of the three situations we are in

// For a running session, can listen for end and fail (which are??)
// and adjust the status as necessary
const DEPLOY_UNKNOWN = 0;       // initial state when entering the page while doing initial queries
const DEPLOY_IN_PROGRESS = 1;
const DEPLOY_COMPLETE = 2;
const DEPLOY_FAILED = 3;

const STEPS = [
  {
    label: translate('deploy.progress.step1'),
    playbooks: ['network_interface-deploy.yml']
  },
  {
    label: translate('deploy.progress.step2'),
    playbooks: ['nova-deploy.yml', 'ironic-deploy.yml', 'magnum-deploy.yml']
  },
  {
    label: translate('deploy.progress.step3'),
    playbooks: ['monasca-agent-deploy.yml', 'monasca-deploy.yml', 'monasca-transform-deploy.yml']
  },
  {
    label: translate('deploy.progress.step4'),
    playbooks: ['ceph-deploy.yml', 'cinder-deploy.yml', 'swift-deploy.yml']
  },
  {
    label: translate('deploy.progress.step5'),
    playbooks: ['hlm-status.yml']
    //playbooks: ['ops-console-status.yml']//swap these to test-run using a short running playbook
  },
  {
    label: translate('deploy.progress.step6'),
    playbooks: ['site.yml']
  }
];

class MyLogViewer extends Component {

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
        <label>
          <input type="checkbox"
                 checked={this.state.autoScroll}
                 onChange={this.handleChange} /> {translate('logviewer.autoscroll')}
        </label>
      </div>
    );
  }
}


class CloudDeployProgress extends BaseWizardPage {
  constructor(props) {
    super(props);

    // List for capturing messages as they are received.  The state
    // variable will be updated regularly with the contents of this
    // list.
    this.logsReceived = List();

    this.state = {
      errorMsg: '',                 // error message to display
      showLog: false,               // controls visibility of log viewer
      playbooksStarted: [],         // list of playbooks that have started
      playbooksComplete: [],        // list of playbooks that have completed
      playbooksError: [],           // list of playbooks that have errored

      // TODO: After ardana-service gets an API to replay events from past
      //   playbook runs, status can be derived entirely from the three
      //   arrays above and the following overall status can be removed
      deployStatus: DEPLOY_UNKNOWN, // overall status of entire deployment

      displayedLogs: List()         // log messages to display in the log viewer
    };

    this.startPlaybook();
  }

  setNextButtonDisabled() {
    return this.state.deployStatus != DEPLOY_COMPLETE;
  }

  setBackButtonDisabled() {
    return this.state.deployStatus != DEPLOY_FAILED;
  }

  getError() {
    return (this.state.errorMsg) ? (
      <div>{translate('deploy.progress.failure')}<br/>
        <pre className='log'>{this.state.errorMsg}</pre></div>) : (<div></div>);
  }

  getProgress() {
    return STEPS.map((step, index) => {
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

  /**
   * Perform a fetch, check for errors, and return a json promise upon success
   */
  fetchJson = (input, init) => {
    return fetch(input, init)
    .then(res => {
          if (res.ok) {
            return res.json();
          } else {
            return Promise.reject(new Error(res.statusText))
          }
        });
  }

  monitorSocket = (playId) => {
    this.socket = io(getAppConfig('shimurl'));
    this.socket.on('playbook-start', this.playbookStarted);
    this.socket.on('playbook-stop', this.playbookStopped);
    this.socket.on('playbook-error', this.playbookError);
    this.socket.on('log', this.logMessage);
    this.socket.on('end', () => { this.socket.disconnect(); });
    this.socket.emit('join', playId);
  }

  startPlaybook = () => {
    // Start the playbook if it has not already been done.  deployStatus will be set
    // initially here.  If the playbook is launched, further updates to the status will
    // be performed as playbook events arrive from the ardana service (which originate
    // in the ansible playbooks)

    if (this.props.sitePlayId) {
      // Get the output of the play that has already been launched

      this.fetchJson('http://localhost:8081/api/v1/clm/plays/' + this.props.sitePlayId, {
        // Note: Use no-cache in order to get an up-to-date response
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      })
      .then(response => {
        if ('endTime' in response) {
          // The play has already ended, and is either complete or failed
          this.setState({deployStatus: (response['code'] == 0 ? DEPLOY_COMPLETE : DEPLOY_FAILED)});

          fetch('http://localhost:8081/api/v1/clm/plays/' + this.props.sitePlayId + "/log")
          .then(response => response.text())
          .then(response => {
            const message = response.trimRight('\n');
            this.logsReceived = List(message);
            this.setState({displayedLogs: this.logsReceived});
          })

          this.fetchJson('http://localhost:8081/api/v1/clm/plays/' + this.props.sitePlayId + "/events")
          .then(response => {
            for (let evt of response) {
              if (evt.event === 'playbook-stop')
                this.playbookStopped(evt.playbook);
              else if (evt.event === 'playbook-start')
                this.playbookStarted(evt.playbook);
              else if (evt.event === 'playbook-error')
                this.playbookError(evt.playbook);
            }
          })
        } else {
          // The play is still in progress
          this.setState({deployStatus: DEPLOY_IN_PROGRESS});
          this.monitorSocket(this.props.sitePlayId);
        }
      })
      .catch((error) => {
        this.setState({errorMsg: error.message});
      });

    } else {

      // Launch the playbook
      this.fetchJson(getAppConfig('shimurl') + '/api/v1/clm/playbooks/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('')
      })
      .then(response => {
        const playId = response['id'];
        this.monitorSocket(playId);
        this.setState({deployStatus: DEPLOY_IN_PROGRESS});
        this.props.updateGlobalState('sitePlayId', playId);
      })
      .catch((error) => {
        this.setState({deployStatus: DEPLOY_FAILED,
                       errorMsg: List(error.message)});
      });
    }
  }

  renderLogButton() {
    const logButtonLabel = this.state.showLog ? 'Hide Log' : 'Show Log';

    if (this.props.sitePlayId || this.state.contents) {
      return (
        <ActionButton
          displayLabel={logButtonLabel}
          clickAction={() => this.setState((prev) => { return {'showLog': !prev.showLog}; }) } />
      );
    }
  }

  render() {
    return (
      <div className='wizard-content'>
        {this.renderHeading(translate('deploy.progress.heading'))}
        <div className='deploy-progress'>
          <div className='progress-body'>
            <div className='col-xs-4'>
              <ul>{this.getProgress()}</ul>
              {this.getError()}
              <div>
                {this.renderLogButton()}
              </div>
            </div>
            <div className='col-xs-8'>
              {this.state.showLog && <MyLogViewer contents={this.state.displayedLogs} />}
            </div>
          </div>
        </div>
        {this.renderNavButtons()}
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
    this.setState((prevState) => {
      const completedPlaybooks = prevState.playbooksComplete.concat(playbook);
      var newState = {'playbooksComplete': completedPlaybooks};
      if (completedPlaybooks.includes('site.yml')) {
        newState.deployStatus = DEPLOY_COMPLETE
      }
      return newState;
    });
  }

  /**
   * callback for when a playbook finishes, the UI component will track which
   * playbooks out of the needed set have started/finished to show status
   * to the user
   * @param {String} the playbook filename
   */
  playbookError = (playbook) => {
    this.setState((prevState) => {
      const errorPlaybooks = prevState.playbooksError.concat(playbook);
      var newState = {'playbooksError': errorPlaybooks};
      if (errorPlaybooks.includes('site.yml')) {
        newState.deployStatus = DEPLOY_FAILED
      }
      return newState;
    });
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

export default CloudDeployProgress;
