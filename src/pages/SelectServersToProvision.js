import React from 'react';

import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import { STATUS } from '../utils/constants.js';
import { ActionButton } from '../components/Buttons.js';
import { YesNoModal } from '../components/Modals.js';
import BaseWizardPage from './BaseWizardPage.js';
import TransferTable from '../components/TransferTable.js';
import { PlaybookProgress } from './CloudDeployProgress.js';

class SelectServers extends BaseWizardPage {
  constructor() {
    super();
    this.state = {
      serverObjects: [],
      availableServers: [],
      selectedServers: []
    };

    this.getSelectedServers = this.getSelectedServers.bind(this);
    this.installServers = this.installServers.bind(this);
  }

  componentWillMount() {
    // retrieve a list of servers that have roles
    fetch(getAppConfig('shimurl') + '/api/v1/clm/model/entities/servers')
      .then(response => response.json())
      .then((responseData) => {
        this.setState({
          serverObjects: responseData,
          availableServers: this.props.filterName(responseData)
        });
      });
  }

  //since the parent controls the next/back buttons, update it when the state changes
  componentDidUpdate(prevProps, prevState) {
    if(this.state.selectedServers.length !== prevState.selectedServers.length) {
      //if there are servers to install, there is an "activeSelection"
      this.props.hasActiveSelection(this.state.selectedServers.length !== 0);
    }
  }

  getSelectedServers(servers) {
    this.setState({selectedServers: servers});
  }

  installServers() {
    // convert names back to objects
    var selectedObjects = [];
    for (let i=0; i<this.state.selectedServers.length; i++) {
      let server = this.state.selectedServers[i];
      for (let j=0; i<this.state.serverObjects.length; j++) {
        let object = this.state.serverObjects[j];
        if (server === object.name || server === object.id) {
          selectedObjects.push(object);
          break;
        }
      }
    }
    this.props.sendSelectedList(selectedObjects);
  }

  render() {
    return (
      <div>
        <div className='content-header'>
          {this.renderHeading(translate('provision.server.heading'))}
        </div>
        <div className='wizard-content'>
          <div className='server-provision'>
            <TransferTable inputList={this.state.availableServers}
              sendSelectedList={this.getSelectedServers}
              leftTableHeader={translate('provision.server.left.table')}
              rightTableHeader={translate('provision.server.right.table')}/>
            <div className='button-container'>
              <ActionButton
                displayLabel={translate('provision.server.install')} clickAction={this.installServers}
                isDisabled={this.state.selectedServers.length == 0}/>
            </div>
            <YesNoModal show={this.props.showModal}
              title={translate('provision.server.confirm.heading')}
              yesAction={this.props.proceedAction} noAction={this.props.cancelAction}>
              {translate('provision.server.confirm.body', this.state.selectedServers.length)}
            </YesNoModal>
          </div>
        </div>
      </div>
    );
  }
}


/*
class ShowInstallProgress extends BaseWizardPage {
  constructor() {
    super();
    this.state = {
      currentStep: 0,
      currentProgress: -1,
      errorMsg: ''
    };

    this.getProgress = this.getProgress.bind(this);
  }

  componentWillMount() {
    this.props.setInstallState(false);
  }

  progressing() {
    // TODO replace with real installation progress
    // fake the steps through progress button for now
    var now = this.state.currentProgress + 1;
    this.setState({currentProgress: now, currentStep: Math.floor(now/2)});
    if (this.state.currentProgress == (this.props.installList.length - 1) * 2) {
      this.setState({errorMsg: 'something is wrong here, please do something'});
    }
    if (this.state.currentProgress == (this.props.installList.length * 2) - 1) {
      this.setState({errorMsg: ''});
      this.props.setInstallState(true);
    }
  }

  getError() {
    return (this.state.errorMsg) ? (
      <div>
        <div className='error-heading'>{translate('provision.server.failure',
          this.props.installList[this.state.currentStep].name)}</div>
        <pre className='log'>{this.state.errorMsg}</pre></div>) : (<div></div>);
  }

  getProgress() {
    let servers = this.props.filterName(this.props.installList);
    return (servers.map((server, index) => {
      var status = '';
      if (this.state.currentProgress >= index) {
        let failStep = (servers.length * 2) - 1;
        if (this.state.currentProgress >= failStep && index == (servers.length - 1)) {
          status = (this.state.currentProgress == failStep) ? 'fail' : 'succeed';
        } else {
          if (this.state.currentStep == index) {
            if (this.state.currentProgress%2 == 0) {
              status = 'progressing';
            } else {
              status = 'succeed';
            }
          } else if (Math.floor(this.state.currentProgress/2) > index) {
            status = 'succeed';
          }
        }
      }
      return (<li key={index} className={status}>{server}</li>);
    }));
  }

  render() {
    return (
      <div>
        <div className='content-header'>
          {this.renderHeading(translate('provision.server.progress.heading'))}
        </div>
        <div className='wizard-content'>
          <div className='playbook-progress'>
            <div className='progress-body'>
              <div className='col-xs-6'>
                <ul>{this.getProgress()}</ul>
              </div>
              <div className='col-xs-6'>
                {this.getError()}
              </div>
            </div>
          </div>
          <ActionButton
            displayLabel='progress'
            clickAction={() => this.progressing()}/>
        </div>
      </div>
    );
  }
}
*/

const OS_INSTALL_STEPS = [
  {
    label: translate('install.progress.step1'),
    playbooks: ['bm-power-status.yml']
  },
  {
    label: translate('install.progress.step2'),
    playbooks: ['cobbler-deploy.yml']
  },
  {
    label: translate('install.progress.step3'),
    playbooks: ['bm-reimage.yml']
  },
  {
    label: translate('install.progress.step4'),
    playbooks: ['dayzero-os-provision.yml']
  }
];


class SelectServersToProvision extends BaseWizardPage {
  constructor() {
    super();
    this.state = {
      installing: false,
      selectedServers: [],
      showModal: false,
      installComplete: false,
      serversSelectedButNotInstalled: false,
      overallStatus: STATUS.UNKNOWN // overall status of install playbook
    };

    this.getSelectedServers = this.getSelectedServers.bind(this);
    this.proceedToInstall = this.proceedToInstall.bind(this);
    this.cancelInstall = this.cancelInstall.bind(this);
  }

  getSelectedServers(servers) {
    this.setState({selectedServers: servers, showModal: true});
  }

  getServerNames(servers) {
    return servers.map((server) => {
      return (server.name) ? server.name : server.id.toString();
    });
  }

  proceedToInstall() {
    this.setState({installing: true, showModal: false});
  }

  cancelInstall() {
    this.setState({showModal: false});
  }

  setInstallCompleteState(isComplete) {
    this.setState({installComplete: isComplete});
  }

  setServersSelectedButNotInstalledState(serversSelected) {
    this.setState({serversSelectedButNotInstalled: serversSelected});
  }

  setNextButtonDisabled = () => {
    if (this.state.installing) {
      return this.state.overallStatus != STATUS.COMPLETE;
    } else {
      return this.state.serversSelectedButNotInstalled;
    }
  }

  updateStatus = (status) => {this.setState({overallStatus: status});}
  updatePlayId = (playId) => {this.props.updateGlobalState('installPlayId', playId);}

  // TODO: Support passing parameters to playbook command

  renderBody() {
    if (this.state.installing) {
      return (
        <div>
          <div className='content-header'>
            {this.renderHeading(translate('provision.server.progress.heading'))}
          </div>
          <div className='wizard-content'>
            <PlaybookProgress
              overallStatus={this.state.overallStatus}
              updateStatus={this.updateStatus}
              playId={this.props.installPlayId}
              updatePlayId={this.updatePlayId}
              steps={OS_INSTALL_STEPS}
              playbook="dayzero-os-provision" />
          </div>
        </div>);
    } else {
      return (
        <SelectServers
          ref='selectServers'
          sendSelectedList={this.getSelectedServers}
          filterName={this.getServerNames}
          showModal={this.state.showModal}
          proceedAction={this.proceedToInstall}
          cancelAction={this.cancelInstall}
          hasActiveSelection={this.setServersSelectedButNotInstalledState.bind(this)}
        />);
    }
  }

  render() {
    return (
      <div className='wizard-page'>
        {this.renderBody()}
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default SelectServersToProvision;
