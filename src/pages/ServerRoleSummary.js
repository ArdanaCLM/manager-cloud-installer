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
import React from 'react';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage.js';
import CollapsibleTable from './ServerRoleSummary/CollapsibleTable.js';
import { ActionButton } from '../components/Buttons.js';
import { EditCloudSettings } from './ServerRoleSummary/EditCloudSettings.js';
import { fromJS } from 'immutable';
import { getServerRoles, isRoleAssignmentValid } from "../utils/ModelUtils.js";

class ServerRoleSummary extends BaseWizardPage {

  constructor(props) {
    super(props);

    this.checkInputs = ['nic-mapping', 'server-group'];
    this.state = {
      expandedGroup: [],
    };
  }

  expandAll() {
    const allGroups = this.props.model.getIn(['inputModel','server-roles']).map(e => e.get('name'));
    this.setState({expandedGroup: allGroups});
  }

  collapseAll() {
    this.setState({expandedGroup: []});
  }

  removeExpandedGroup = (groupName) => {
    this.setState(prevState => {
      return {'expandedGroup': prevState.expandedGroup.filter(e => e != groupName)};
    });
  }

  addExpandedGroup = (groupName) => {
    this.setState((prevState) => {
      return {'expandedGroup': prevState.expandedGroup.concat(groupName)};
    });
  }

  saveEditServer = (server) =>  {
    let model = this.props.model;
    let index = model.getIn(['inputModel', 'servers']).findIndex(e => e.get('id') === server.id);
    if (index >= 0) {
      const update_svr = {
        //fields from edit server
        'ip-addr': server['ip-addr'],
        'mac-addr': server['mac-addr'],
        'server-group': server['server-group'],
        'nic-mapping': server['nic-mapping'],
        'ilo-ip': server['ilo-ip'],
        'ilo-user': server['ilo-user'],
        'ilo-password': server['ilo-password']
      };
      model = model.mergeIn(['inputModel', 'servers', index], update_svr);
    } else {
      model = model.updateIn(['inputModel', 'servers'], list => list.push(fromJS(server)));
    }

    this.props.updateGlobalState('model', model);
  }

  isPageValid = () => {
    return getServerRoles(this.props.model).every(role => {
      return isRoleAssignmentValid(role, this.checkInputs);
    });
  }

  setNextButtonDisabled = () => !this.isPageValid();

  renderCollapsibleTable() {
    let tableConfig = {
      columns: [
        {name: 'name'},
        {name: 'ip-addr',},
        {name: 'server-group'},
        {name: 'nic-mapping'},
        {name: 'mac-addr'},
        {name: 'id', hidden: true},
        {name: 'ilo-ip', hidden: true},
        {name: 'ilo-user', hidden: true},
        {name: 'ilo-password', hidden: true},
        {name: 'role', hidden: true}
      ]
    };
    return (
      <CollapsibleTable
        addExpandedGroup={this.addExpandedGroup} removeExpandedGroup={this.removeExpandedGroup}
        model={this.props.model} tableConfig={tableConfig} expandedGroup={this.state.expandedGroup}
        saveEditServer={this.saveEditServer} checkInputs={this.checkInputs}/>
    );
  }

  render() {
    return (
      <div className='wizard-page'>
        <EditCloudSettings
          show={this.state.showCloudSettings}
          onHide={() => this.setState({showCloudSettings: false})}
          model={this.props.model}
          updateGlobalState={this.props.updateGlobalState}/>
        <div className='content-header'>
          <div className='titleBox'>
            {this.renderHeading(translate('server.role.summary.heading'))}
          </div>
          <div className='buttonBox'>
            <div className='btn-row'>
              <ActionButton displayLabel={translate('edit.cloud.settings')}
                clickAction={() => this.setState({showCloudSettings: true})} />
              <ActionButton type='default'
                displayLabel={translate('collapse.all')} clickAction={() => this.collapseAll()} />
              <ActionButton type='default'
                displayLabel={translate('expand.all')} clickAction={() => this.expandAll()} />
            </div>
          </div>
        </div>
        <div className='wizard-content'>{this.renderCollapsibleTable()}</div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default ServerRoleSummary;
