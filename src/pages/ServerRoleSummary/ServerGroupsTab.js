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
import { ActionButton } from '../../components/Buttons.js';
import { alphabetically } from '../../utils/Sort.js';
import { YesNoModal } from '../../components/Modals.js';
import ServerGroupDetails, { getServerGroupIndex } from './ServerGroupDetails.js';

class ServerGroupsTab extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      showServerGroupDetails: false,
      showViewMode: false,
      showRemoveConfirmation: false,
      serverGroupToRemove: ''
    };
  }

  addServerGroup = () => {
    if (!this.state.showServerGroupDetails) {
      this.setState({showServerGroupDetails: true, value: ''});
    }
  }

  editServerGroup = (selected) => {
    if (!this.state.showServerGroupDetails) {
      this.setState({showServerGroupDetails: true, value: selected});
    }
  }

  confirmRemoveServerGroup = (name) => {
    if (!this.state.showServerGroupDetails) {
      this.setState({showRemoveConfirmation: true, serverGroupToRemove: name});
    }
  }

  removeServerGroup = (name) => {
    this.setState({showRemoveConfirmation: false, serverGroupToRemove: ''});
    const index = getServerGroupIndex(this.props.model, name);
    if (index !== -1) {
      const model = this.props.model.removeIn(['inputModel','server-groups', index]);
      this.props.updateGlobalState('model', model);
    }
  }

  viewServerGroup = (selected) => {
    if (!this.state.showServerGroupDetails) {
      this.setState({showServerGroupDetails: true, showViewMode: true, value: selected});
    }
  }

  renderViewDetails = () => {
    const header = translate('details.server.group.view') + ': ' + this.state.value.name;
    let networks = <div className='details-line'>-</div>;
    if (this.state.value.networks.length > 0) {
      networks = this.state.value.networks.map((network, index) => {
        return (<div className='details-line' key={index}>{network}</div>);
      });
    }
    let serverGroups = <div className='details-line'>-</div>;
    if (this.state.value.serverGroups.length > 0) {
      serverGroups = this.state.value.serverGroups.map((serverGroup, index) => {
        return (<div className='details-line' key={index}>{serverGroup}</div>);
      });
    }

    return (
      <div className='details-section'>
        <div className='details-header'>{header}</div>
        <div className='details-body'>
          <div className='details-title'>{translate('edit.networks') + ':'}</div>
          {networks}
          <div className='details-title'>{translate('edit.server.groups') + ':'}</div>
          {serverGroups}
          <div className='btn-row details-btn'>
            <div className='btn-container'>
              <ActionButton key='ok' displayLabel={translate('ok')}
                clickAction={this.hideServerGroupDetails}/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  hideServerGroupDetails = () => {
    this.setState({showServerGroupDetails: false, showViewMode: false, value: ''});
  }

  render() {
    const rows = this.props.model.getIn(['inputModel','server-groups'])
      .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
      .map((m,idx) => {
        let numNetworks = '-';
        if (m.has('networks')) {
          numNetworks = m.get('networks').size;
        }

        let numServerGroups = '-';
        if (m.has('server-groups')) {
          numServerGroups = m.get('server-groups').size;
        }

        const name = m.get('name');
        const selected = {
          name: name,
          networks: m.has('networks') ? m.get('networks').toJS() : [],
          serverGroups: m.has('server-groups') ? m.get('server-groups').toJS() : [],
        };

        let viewClass = 'glyphicon glyphicon-info-sign view-button';
        let editClass = 'glyphicon glyphicon-pencil edit-button';
        let removeClass = 'fa fa-minus remove-button';
        if (this.state.showServerGroupDetails) {
          viewClass = viewClass + ' disabled';
          editClass = editClass + ' disabled';
          removeClass = removeClass + ' disabled';
        }

        return (
          <tr key={idx}>
            <td>{name}</td>
            <td>{numNetworks}</td>
            <td>{numServerGroups}</td>
            <td>
              <div className='row-action-container'>
                <span onClick={() => this.viewServerGroup(selected)} className={viewClass}/>
                <span onClick={() => this.editServerGroup(selected)} className={editClass}/>
                <span onClick={() => this.confirmRemoveServerGroup(name)} className={removeClass}/>
              </div>
            </td>
          </tr>);
      });

    let addClass = 'material-icons add-button';
    addClass = this.state.showServerGroupDetails ? addClass + ' disabled' : addClass;
    let actionRow = (
      <tr key='serverGroupAction' className='action-row'>
        <td><i className={addClass} onClick={this.addServerGroup}>
          add_circle</i>{translate('add.server.group')}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    );

    let detailsSection = (
      <div className='details-section'>
        <div className='no-options'>{translate('no.options.available')}</div>
      </div>);
    if (this.state.showServerGroupDetails) {
      if (this.state.showViewMode) {
        detailsSection = this.renderViewDetails();
      } else {
        detailsSection = (<ServerGroupDetails model={this.props.model}
          value={this.state.value} updateGlobalState={this.props.updateGlobalState}
          closeAction={this.hideServerGroupDetails}/>);
      }
    }

    let confirmRemoveSection = '';
    if (this.state.showRemoveConfirmation) {
      confirmRemoveSection = (
        <YesNoModal show={this.state.showRemoveConfirmation} title={translate('warning')}
          yesAction={() => this.removeServerGroup(this.state.serverGroupToRemove) }
          noAction={() => this.setState({showRemoveConfirmation: false})}>
          {translate('details.server.group.confirm.remove', this.state.serverGroupToRemove)}
        </YesNoModal>
      );
    }

    return (
      <div>
        <div className='col-xs-8 verticalLine'>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('server.group.name')}</th>
                <th>{translate('number.networks')}</th>
                <th>{translate('number.server.groups')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows}
              {actionRow}
            </tbody>
          </table>
        </div>
        <div className='col-xs-4'>
          {detailsSection}
        </div>
        {confirmRemoveSection}
      </div>
    );
  }
}

export default ServerGroupsTab;
