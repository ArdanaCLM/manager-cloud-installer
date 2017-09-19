import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import { ActionButton } from '../components/Buttons.js';
import { YesNoModal } from '../components/Modals.js';
import BaseWizardPage from './BaseWizardPage.js';
import TransferTable from '../components/TransferTable.js';

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

  setNextButtonDisabled() {
    return this.state.selectedServers.length !== 0;
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
      <div className='server-provision'>
        {this.renderHeading(translate('provision.server.heading'))}
        <TransferTable inputList={this.state.availableServers}
          sendSelectedList={this.getSelectedServers}
          leftTableHeader={translate('provision.server.left.table')}
          rightTableHeader={translate('provision.server.right.table')}/>
        <div className='button-container'>
          <ActionButton
            displayLabel={translate('provision.server.install')} clickAction={this.installServers}
            isDisabled={this.state.selectedServers.length == 0}/>
        </div>
        {this.renderNavButtons()}
        <YesNoModal show={this.props.showModal}
          title={translate('provision.server.confirm.heading')}
          body={translate('provision.server.confirm.body', this.state.selectedServers.length)}
          yesAction={this.props.proceedAction} noAction={this.props.cancelAction}
        />
      </div>
    );
  }
}


class ShowInstallProgress extends BaseWizardPage {
  constructor() {
    super();
    this.state = {
      installComplete: false,
      currentStep: 0,
      currentProgress: -1,
      errorMsg: ''
    };

    this.getProgress = this.getProgress.bind(this);
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
      this.setState({errorMsg: '', installComplete: true});
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

  setNextButtonDisabled() {
    return !this.state.installComplete;
  }

  render() {
    return (
      <div>
        {this.renderHeading(translate('provision.server.progress.heading'))}
        <div className='deploy-progress'>
          <div className='progress-body'>
            <div className='col-xs-6'>
              <ul>{this.getProgress()}</ul>
            </div>
            <div className='col-xs-6'>
              {this.getError()}
            </div>
          </div>
        </div>
        <div>
          <ActionButton
            displayLabel='progress'
            clickAction={() => this.progressing()}/>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}


class SelectServersToProvision extends Component {
  constructor() {
    super();
    this.state = {
      installing: false,
      selectedServers: [],
      showModal: false
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

  renderBody() {
    if (!this.state.installing) {
      return (
        <SelectServers
          back={this.props.back}
          next={this.props.next}
          sendSelectedList={this.getSelectedServers}
          filterName={this.getServerNames}
          showModal={this.state.showModal}
          proceedAction={this.proceedToInstall}
          cancelAction={this.cancelInstall}
        />);
    } else {
      return (
        <ShowInstallProgress
          next={this.props.next}
          installList={this.state.selectedServers}
          filterName={this.getServerNames}
        />);
    }
  }

  render() {
    return (
      <div className='wizard-content'>
        {this.renderBody()}
      </div>
    );
  }
}

export default SelectServersToProvision;
