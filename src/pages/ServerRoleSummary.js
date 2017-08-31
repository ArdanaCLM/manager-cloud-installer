import React from 'react';

import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage.js';
import CollapsibleTable from '../components/CollapsibleTable.js';

class ServerRoleSummary extends BaseWizardPage {
  constructor() {
    super();
    this.state = {serverObjects: []};

    this.formatServerObjects = this.formatServerObjects.bind(this);
  }

  componentWillMount() {
    // retrieve a list of servers that have roles
    fetch('http://localhost:8081/api/v1/clm/model/entities/servers')
      .then(response => response.json())
      .then((responseData) => {
        let data = this.formatServerObjects(responseData);
        this.setState({
          serverObjects: data,
        });
      });
  }

  formatServerObjects(objects) {
    // find unique server roles
    let serverRoles = objects.map((obj) => {return obj.role;}).sort();
    let uniqueRoles = [...new Set(serverRoles)];

    // create data object for each server role
    let groups = [];
    for (let i=0; i<uniqueRoles.length; i++) {
      let servers = objects.filter((obj) => {return obj.role === uniqueRoles[i];});
      let formattedServers = [];
      for (let i=0; i<servers.length; i++) {
        let server = servers[i];
        let newObj = {
          name: (server.name) ? server.name : server.id,
          ipAddr: server['ip-addr'],
          nicMapping: server['nic-mapping'],
          serverGroup: server['server-group']
        };
        formattedServers.push(newObj);
      }
      let group = {groupName: uniqueRoles[i], members: formattedServers};
      groups.push(group);
    }
    return groups;
  }

  render() {
    return (
      <div className='wizard-content'>
        {this.renderHeading(translate('server.role.summary.heading'))}
        <CollapsibleTable showExpandAllButton data={this.state.serverObjects}/>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default ServerRoleSummary;
