import React from 'react';

import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage.js';
import CollapsibleTable from '../components/CollapsibleTable.js';
import { List, Map } from 'immutable';
import { alphabetically } from '../utils/Sort.js';

class ServerRoleSummary extends BaseWizardPage {

  constructor(props) {
    super(props);
  }

  byServerNameOrId = (a,b) => {
    return alphabetically(a.get('name') || a.get('id'), b.get('name') || b.get('id'));
  }

  formatServerObjects = () => {

    const servers = this.props.model.getIn(['inputModel','servers']);

    // Create a map of role names to list of servers in each, e.g.
    //   { 'COMPUTE':[{name:'one',...},{name:'two',...},  'CONTROLLER': [...]}
    let groupMap = Map();
    servers.sort((a,b) => this.byServerNameOrId(a,b)).forEach(server => {
      groupMap = groupMap.update(server.get('role'),
        new List(),           // create a new list if role is not in groupMap
        list => list.push(    // append this server to the role's list
          new Map({
            'name': server.get('name') || server.get('id'),
            'ipAddr': server.get('ip-addr'),
            'nicMapping': server.get('nic-mapping'),
            'serverGroup': server.get('server-group')
          })
        ));
    });

    // Convert the map to a list of objects and return it, e.g.
    //  [ {groupName:'COMPUTE', members:[{name:'one',...},{name:'two',...},
    //    {groupName:'CONTROLLER', members:[..]}... ]
    return groupMap.keySeq().sort()         // get a sorted list of keys
      .map(g => new Map({
        'groupName': g,
        'members': groupMap.get(g)}))
      .toJS();                              // return as JavaScript objects
  }

  render() {
    return (
      <div className='wizard-page'>
        <div className='wizard-content'>
          {this.renderHeading(translate('server.role.summary.heading'))}
          <CollapsibleTable showCollapseAllButton showExpandAllButton data={this.formatServerObjects()}/>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default ServerRoleSummary;
