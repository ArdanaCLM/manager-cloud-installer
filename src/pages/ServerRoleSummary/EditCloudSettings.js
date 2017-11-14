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
import React, { Component } from 'react';
import { translate } from '../../localization/localize.js';
import { Tabs, Tab } from 'react-bootstrap';
import { ConfirmModal } from '../../components/Modals.js';
import NicMappingTab from './NicMappingTab.js';
import ServerGroupsTab from './ServerGroupsTab.js';
import NetworksTab from './NetworksTab.js';
import DiskModelsTab from './DiskModelsTab.js';
import InterfaceModelsTab from './InterfaceModelsTab.js';

const TAB = {
  NIC_MAPPINGS: 'NIC_MAPPINGS',
  SERVER_GROUPS: 'SERVER_GROUPS',
  NETWORKS: 'NETWORKS',
  DISK_MODELS: 'DISK_MODELS',
  INTERFACE_MODELS: 'INTERFACE_MODELS'
};

class EditCloudSettings extends Component {

  constructor(props) {
    super(props);
    this.state = {
      key: TAB.NIC_MAPPINGS
    };
  }

  render() {
    return (
      <ConfirmModal
        show={this.props.show}
        title={translate('edit.cloud.settings')}
        className={'cloud-settings'}
        hideFooter='true'
        onHide={this.props.onHide}>

        <Tabs id='editCloudSettings' activeKey={this.state.key} onSelect={(tabKey) => {this.setState({key: tabKey});}}>
          <Tab eventKey={TAB.NIC_MAPPINGS} title={translate('edit.nic.mappings')}>
            <NicMappingTab model={this.props.model} updateGlobalState={this.props.updateGlobalState} />
          </Tab>
          <Tab eventKey={TAB.SERVER_GROUPS} title={translate('edit.server.groups')}>
            <ServerGroupsTab model={this.props.model} updateGlobalState={this.props.updateGlobalState} />
          </Tab>
          <Tab eventKey={TAB.NETWORKS} title={translate('edit.networks')}>
            <NetworksTab model={this.props.model} updateGlobalState={this.props.updateGlobalState} />
          </Tab>
          <Tab eventKey={TAB.DISK_MODELS} title={translate('edit.disk.models')}>
            <DiskModelsTab model={this.props.model} updateGlobalState={this.props.updateGlobalState} />
          </Tab>
          <Tab eventKey={TAB.INTERFACE_MODELS} title={translate('edit.interface.models')}>
            <InterfaceModelsTab model={this.props.model} updateGlobalState={this.props.updateGlobalState} />
          </Tab>
        </Tabs>

      </ConfirmModal>
    );
  }
}

export { EditCloudSettings };
