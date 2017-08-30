import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import { getAppConfig } from '../components/ConfigHelper.js';
import { ActionButton } from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';
import io from 'socket.io-client';
import { List } from 'immutable';
import debounce from 'lodash/debounce';


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


class Progress extends BaseWizardPage {
  constructor() {
    super();

    // List for capturing messages as they are received.  The state
    // variable will be updated regularly with the contents of this
    // list.
    this.logsReceived = List();

    this.state = {
      deployComplete: false,
      errorMsg: '',
      showLog: false,
      playId: '',
      playbooksStarted: [],
      playbooksComplete: [],
      playbooksError: [],

      displayedLogs: List()
    };

    this.startPlaybook();
  }

  setNextButtonDisabled() {
    return ((this.state.playbooksComplete.indexOf('site.yml') === -1) ||
            (this.state.playbooksError.length !== 0));
  }

  //TODO - evaluate if we can get error messages from the playbooks and propagate them here
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

      //if the status has not previoulsy been set to fail or complete,
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
   * this function and its follow-on exist just to test out the progress functionality
   */
  progressing() {
    // fake the steps through progress button for now
    let allPlaybooks = [
      'network_interface-deploy.yml',
      'nova-deploy.yml', 'ironic-deploy.yml', 'magnum-deploy.yml',
      'monasca-agent-deploy.yml', 'monasca-deploy.yml', 'monasca-transform-deploy.yml',
      'ceph-deploy.yml', 'cinder-deploy.yml', 'swift-deploy.yml',
      'hlm-status.yml',
      'site.yml'
    ];

    this.progressNext.bind(this)(allPlaybooks, 0);

  }

  /**
   * recursively called function to fake playbook progress for dev/test purposes
   */
  progressNext(allPlaybooks, index) {
    var limit = (allPlaybooks.length * 2);
    if(index === limit) {
      return;
    } else if(index === 0 || index % 2 === 0) {
      this.playbookStarted(allPlaybooks[(index / 2)]);
    } else {
      this.playbookStopped(allPlaybooks[Math.floor(index / 2)]);
    }

    var callNext = this.progressNext.bind(this);
    setTimeout(function() {
      callNext(allPlaybooks, index + 1);
    }, 1000);
  }

  startPlaybook() {
    /* TODO: Avoid starting a new playbook if one is already running. Should obtain playId from progress */
    var playId;

    var listenLive = true;

    if (playId) {

      fetch('http://localhost:8081/api/v1/clm/plays/' + playId, {
        // Note: Use no-cache in order to get an up-to-date response
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      })
      .then(response => {
        if (! response.ok) {
          throw (response.statusText);
        } else {
          return response.json();
        }})
      .then(response => {
        if ('endTime' in response) {
          listenLive = false;
          fetch('http://localhost:8081/api/v1/clm/plays/' + playId + "/log")
          .then(response => response.text())
          .then(response => {
            const message = response.trimRight('\n')
            this.logsReceived = List(message)
            this.setState({contents: this.logsReceived});
          })
        }
      })
      .catch((error) => {
        list = error.trimRight('\n').split('\n');
        this.setState({contents: List(list)});
      });
    }

    if (listenLive) {
      fetch(getAppConfig('shimurl') + '/api/v1/clm/playbooks/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('')
      })
      .then(response => {
        if (! response.ok) {
          throw (response.statusText);
        } else {
          return response.json();
        }})
      .then(response => {
        playId = response['id'];
        this.setState({playId: playId});

        // this.socket = io(getAppConfig('shimurl'));
        this.socket = io('http://localhost:9085');
        this.socket.on('playbook-start', this.playbookStarted);
        this.socket.on('playbook-stop', this.playbookStopped);
        this.socket.on('playbook-error', this.playbookError);
        this.socket.on('log', this.logMessage);
        this.socket.on('end', () => { this.socket.disconnect(); });
        this.socket.emit('join', playId);
      });
    }
  }

  renderLogButton() {
    const logButtonLabel = this.state.showLog ? 'Hide Log' : 'Show Log';

    if (this.state.playId) {
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
              <div>
                <ActionButton
                  displayLabel='Progress'
                  hasNext
                  clickAction={() => this.progressing()}/>
                {this.renderLogButton()}
              </div>
            </div>
            <div className='col-xs-8'>
              {this.state.showLog ? <MyLogViewer contents={this.state.displayedLogs} /> : ''}
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
      return {'playbooksComplete': prevState.playbooksComplete.concat(playbook)};
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
      return {'playbooksError': prevState.playbooksError.concat(playbook)};
    });
  }

  logMessage = (message) => {
    console.log("received log");
    this.logsReceived = this.logsReceived.push(message);
    this.updateState(this.logsReceived);
  }

  // Update the state.  Uses lodash.debounce to avoid getting inunadated by fast logs,
  // by avoiding repeated calls within a short amount of time
  updateState = debounce((data) => {
    console.log("updating log on screen");
    this.setState({displayedLogs: data});
  }, 100)
}

class CloudDeployProgress extends Component {
  render() {
    // TODO take out the back button when dev mode implementation is ready
    // return (<Progress next={this.props.next}/>);
    return (<Progress back={this.props.back} next={this.props.next}/>);
  }
}

export default CloudDeployProgress;
