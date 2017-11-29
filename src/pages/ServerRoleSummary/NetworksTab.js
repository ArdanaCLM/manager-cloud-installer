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
import UpdateNetworks  from './UpdateNetworks.js';
import { YesNoModal } from '../../components/Modals.js';
import { MODE } from '../../utils/constants.js';
import { alphabetically } from '../../utils/Sort.js';

class NetworksTab extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showRemoveConfirmation: false,
      mode: MODE.NONE,
      networkName: ''
    };
  }

  handleAddNetwork = () => {
    if(this.state.mode === MODE.NONE) {
      this.setState({mode: MODE.ADD});
    }
  }

  handleEditNetwork = (data) => {
    if(this.state.mode === MODE.NONE) {
      this.setState({mode: MODE.EDIT, networkName: data.get('name')});
    }
  }

  handleConfirmDeleteNetwork = (data) => {
    if(this.state.mode === MODE.NONE) {
      this.setState({showRemoveConfirmation: true, networkName: data.get('name')});
    }
  }

  handleDeleteNetwork = () => {
    let idx = this.props.model.getIn(['inputModel','networks']).findIndex(
      net => net.get('name') === this.state.networkName);
    let model = this.props.model.removeIn(['inputModel', 'networks', idx]);
    this.setState({showRemoveConfirmation: false,  networkName: ''});
    this.props.updateGlobalState('model', model);
  }

  handleCancelUpdateNetwork = () => {
    this.setState({mode : MODE.NONE, networkName: ''});
  }

  renderRemoveConfirmation() {
    if (this.state.showRemoveConfirmation) {
      return (
        <YesNoModal show={this.state.showRemoveConfirmation} title={translate('warning')}
          yesAction={() => this.handleDeleteNetwork(this.state.networkName) }
          noAction={() => this.setState({showRemoveConfirmation: false})}>
          {translate('network.confirm.remove', this.state.networkName)}
        </YesNoModal>
      );
    }
  }

  renderActionRow() {
    let addClass = 'material-icons add-button';
    addClass = this.state.mode !== MODE.NONE ? addClass + ' disabled' : addClass;
    return (
      <tr key='networkAction' className='action-row'>
        <td><i className={addClass} onClick={this.handleAddNetwork}>add_circle</i>
          {translate('add.network')}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    );
  }

  renderUpdateNetworkSection() {
    let extraProps = {};
    if(this.state.mode === MODE.EDIT) {
      extraProps.networkName = this.state.networkName;
    }
    return (
      <div className='network-update-container col-xs-3'>
        <UpdateNetworks ref={'updateNetwork' + this.state.mode}
          model={this.props.model} mode={this.state.mode} {...extraProps}
          updateGlobalState={this.props.updateGlobalState}
          closeAction={this.handleCancelUpdateNetwork}/>
      </div>
    );

  }

  renderNetworkTable() {
    const checkMark = <i className='material-icons data-icon'>check</i>;
    let editClass = 'glyphicon glyphicon-pencil edit-button';
    let removeClass = 'glyphicon glyphicon-trash remove-button';
    if (this.state.mode !== MODE.NONE) {
      editClass = editClass + ' disabled';
      removeClass = removeClass + ' disabled';
    }

    const rows = this.props.model.getIn(['inputModel','networks'])
      .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
      .map((network, idx) => {
        return (
          <tr key={idx}>
            <td>{network.get('name')}</td>
            <td>{network.get('vlanid')}</td>
            <td>{network.get('cidr')}</td>
            <td>{network.get('gateway-ip')}</td>
            <td>{network.get('network-group')}</td>
            <td>{network.get('tagged-vlan') ? checkMark : ''}</td>
            <td>
              <div className='row-action-container'>
                <span onClick={() => this.handleEditNetwork(network)} className={editClass} />
                <span onClick={() => this.handleConfirmDeleteNetwork(network)} className={removeClass}/>
              </div>
            </td>
          </tr>
        );
      });
    let netClass = 'network-table-container ';
    netClass = this.state.mode === MODE.NONE ? netClass + 'col-xs-12' :
      netClass + 'col-xs-9 verticalLine';

    return (
      <div className={netClass}>
        <table className='table'>
          <thead>
            <tr>
              <th>{translate('network')}</th>
              <th>{translate('vlanid')}</th>
              <th>{translate('cidr')}</th>
              <th>{translate('gateway')}</th>
              <th>{translate('network-group')}</th>
              <th>{translate('tagged-vlan')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows}
            {this.renderActionRow()}
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    return (
      <div className='network'>
        <div className='network-container'>
          {this.renderNetworkTable()}
          {this.state.mode !== MODE.NONE && this.renderUpdateNetworkSection()}
        </div>
        {this.renderRemoveConfirmation()}
      </div>
    );
  }
}
export default NetworksTab;
