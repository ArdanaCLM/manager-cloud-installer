import React from 'react';

import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage.js';
import TransferTable from '../components/TransferTable.js';

class SelectServersToProvision extends BaseWizardPage {
  constructor() {
    super();
    this.state = {
      availableServers: ['']
    };

    // retrieve a list of servers that have roles
    fetch('http://localhost:8081/api/v1/clm/model/entities/servers')
      .then(response => response.json())
      .then((responseData) => {
        this.setState({
          availableServers: responseData
        });
      });
  }

  render() {
    return (
      <div className='wizardContentPage'>
        <div className='heading'>{translate('provision.server.heading')}</div>
        <div className='server-provision'>
          <div className='body'>
            <TransferTable inputList={this.state.availableServers}
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
