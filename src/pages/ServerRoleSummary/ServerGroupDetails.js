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
import { fromJS } from 'immutable';
import { translate } from '../../localization/localize.js';
import { ServerInput } from '../../components/ServerUtils.js';
import { ActionButton } from '../../components/Buttons.js';
import { InlineAddRemoveDropdown } from '../../components/InlineAddRemoveFields.js';
import { getModelIndexByName } from '../../components/ServerUtils.js';
import { UniqueNameValidator } from '../../utils/InputValidators.js';

class ServerGroupDetails extends Component {
  constructor(props) {
    super(props);
    if (props.value === '') {
      // add mode
      this.state = {
        name: '',
        networks: [],
        serverGroups: []
      };
    } else {
      this.state = {
        // edit mode
        name: props.value.name,
        networks: props.value.networks,
        serverGroups: props.value.serverGroups
      };
      // for comparison purposes when checking for changes
      this.origName = this.props.value.name;
      this.origNetworks = this.props.value.networks.slice().sort();
      this.origServerGroups = this.props.value.serverGroups.slice().sort();
    }
  }

  handleInputLine = (e, valid, props) => {
    let value = e.target.value;
    this.setState({name: value});
  }

  getSelectedNetworks = (list) => {
    this.setState({networks: list});
  }

  getSelectedServerGroups = (list) => {
    this.setState({serverGroups: list});
  }

  saveServerGroup = () => {
    let serverGroup = {'name': this.state.name};
    if (this.state.networks.length > 0) {
      serverGroup['networks'] = this.state.networks;
    }
    if (this.state.serverGroups.length > 0) {
      serverGroup['server-groups'] = this.state.serverGroups;
    }
    let model = this.props.model;

    if (this.props.value === '') {
      // add mode
      model = model.updateIn(['inputModel', 'server-groups'],
        list => list.push(fromJS(serverGroup)));
    } else {
      // edit mode
      const index = getModelIndexByName(this.props.model, 'server-groups', this.origName);
      if (index !== -1) {
        model = model.updateIn(['inputModel', 'server-groups'],
          list => list.splice(index, 1, fromJS(serverGroup)));
      }
    }
    this.props.updateGlobalState('model', model);
    this.props.closeAction();
  }

  checkDataToSave = () => {
    if (this.props.value === '') {
      return this.state.name !== '';
    } else {
      let newNetworks = this.state.networks.slice().sort();
      let newServerGroups = this.state.serverGroups.slice().sort();
      if ((this.state.name !== '' && this.state.name !== this.origName) ||
        ((JSON.stringify(newNetworks) !== JSON.stringify(this.origNetworks)) ||
         (JSON.stringify(newServerGroups) !== JSON.stringify(this.origServerGroups)))) {
        return true;
      } else {
        return false;
      }
    }
  }

  render() {
    const networkDefaultOption = {
      label: translate('none'),
      value: ''
    };
    const serverGroupDefaultOption = {
      label: translate('none'),
      value: ''
    };
    const networks = this.props.model.getIn(['inputModel','networks'])
      .map((network) => {return network.get('name');}).sort().toJS();
    const serverGroups = this.props.model.getIn(['inputModel','server-groups'])
      .map((group) => {return group.get('name');}).sort().toJS();
    const header = (this.props.value === '') ? translate('add.server.group') :
      translate('edit.server.group');

    let exceptions = [];
    let extraProps = {names: serverGroups, check_nospace: true};
    if (this.props.value !== '') {
      exceptions.push(this.state.name);
      // remove orig name from the list to check for uniqueness in edit mode
      if (serverGroups.indexOf(this.origName) !== -1) {
        extraProps.names.splice(serverGroups.indexOf(this.origName), 1);
      }
    }

    return (
      <div className='col-xs-4'>
        <div className='details-section'>
          <div className='details-header'>{header}</div>
          <div className='details-body'>
            <ServerInput isRequired={true} placeholder={translate('server.group.name') + '*'}
              inputValue={this.state.name} inputName='name' inputType='text' {...extraProps}
              inputAction={this.handleInputLine} inputValidate={UniqueNameValidator}
              autoFocus={true}/>
            <div className='details-group-title'>{translate('edit.networks') + ':'}</div>
            <InlineAddRemoveDropdown name='networks' options={networks}
              values={this.state.networks} defaultOption={networkDefaultOption}
              sendSelectedList={this.getSelectedNetworks}/>
            <div className='details-group-title'>{translate('edit.server.groups') + ':'}</div>
            <InlineAddRemoveDropdown name='serverGroups' options={serverGroups}
              values={this.state.serverGroups} defaultOption={serverGroupDefaultOption}
              sendSelectedList={this.getSelectedServerGroups} exceptions={exceptions}/>
            <div className='btn-row details-btn'>
              <div className='btn-container'>
                <ActionButton key='cancel' type='default' clickAction={this.props.closeAction}
                  displayLabel={translate('cancel')}/>
                <ActionButton key='save' clickAction={this.saveServerGroup}
                  displayLabel={translate('save')} isDisabled={!this.checkDataToSave()}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ServerGroupDetails;
