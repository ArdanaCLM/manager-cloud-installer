import React from 'react';

import { translate } from '../localization/localize.js';
import { ActionButton } from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';
import TransferTable from '../components/TransferTable.js';

class SelectServersToProvision extends BaseWizardPage {
  constructor() {
    super();
    this.state = {
      serverObjects: [],
      selectedObjects: [],
      availableServers: [],
      selectedServers: []
    };

    this.getSelectedServers = this.getSelectedServers.bind(this);
    this.getServerNames = this.getServerNames.bind(this);
    this.installServers = this.installServers.bind(this);
  }

  componentWillMount() {
    // retrieve a list of servers that have roles
    fetch('http://localhost:8081/api/v1/clm/model/entities/servers')
      .then(response => response.json())
      .then((responseData) => {
        this.setState({
          serverObjects: responseData,
          availableServers: this.getServerNames(responseData)
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
    this.setState({selectedObjects: selectedObjects});  //save values in state for now
  }

  getServerNames(servers) {
    return servers.map((server) => {
      return (server.name) ? server.name : server.id.toString();
    });
  }

  render() {
    return (
      <div className='wizardContentPage'>
        <div className='heading'>{translate('provision.server.heading')}</div>
        <div className='server-provision'>
          <div className='body'>
            <TransferTable inputList={this.state.availableServers}
              sendSelectedList={this.getSelectedServers}
              leftTableHeader={translate('provision.server.left.table')}
              rightTableHeader={translate('provision.server.right.table')}/>
          </div>
        </div>
        <div>
          <ActionButton
            displayLabel={translate('provision.server.install')} clickAction={this.installServers}
            isDisabled={this.state.selectedServers.length == 0}/>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default SelectServersToProvision;
