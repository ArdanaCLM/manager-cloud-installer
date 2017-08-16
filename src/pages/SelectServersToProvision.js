import React from 'react';

import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage.js';
import TransferTable from '../components/TransferTable.js';

class SelectServersToProvision extends BaseWizardPage {
  constructor() {
    super();
    this.state = {
      availableServers: [],
      selectedServers: []
    };

    this.getSelectedServers = this.getSelectedServers.bind(this);

    // retrieve a list of servers that have roles
    fetch('http://localhost:8081/api/v1/clm/model/entities/servers')
      .then(response => response.json())
      .then((responseData) => {
        this.setState({
          availableServers: responseData
        });
      });
  }

  setNextButtonLabel() {
    return translate('provision.server.install');
  }

  setNextButtonDisabled() {
    return this.state.selectedServers.length == 0;
  }

  getSelectedServers(servers) {
    this.setState({selectedServers: servers});  //save values in state for now
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
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default SelectServersToProvision;
