import React, { Component } from 'react';
import { fromJS } from 'immutable';
import { translate } from '../../localization/localize.js';
import { ServerInput, ServerDropdown } from '../../components/ServerUtils.js';
import { ActionButton } from '../../components/Buttons.js';
import { InlineAddRemoveDropdown } from '../../components/InlineAddRemoveFields.js';

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
    };
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
      const index = getServerGroupIndex(this.props.model, this.origName);
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
      label: translate('details.network.none'),
      value: ''
    };
    const serverGroupDefaultOption = {
      label: translate('details.server.group.none'),
      value: ''
    };
    let networkModel = this.props.model.getIn(['inputModel','networks'])
      .map((network) => {return network.get('name');}).sort().toJS();
    let serverGroupModel = this.props.model.getIn(['inputModel','server-groups'])
      .map((group) => {return group.get('name');}).sort().toJS();
    let header = (this.props.value === '') ? translate('add.server.group') :
      translate('edit.server.group');
    let exceptions = [];
    if (this.props.value !== '') {
      exceptions.push(this.state.name);
    }

    return (
      <div className='details-section'>
        <div className='details-header'>{header}</div>
        <div className='details-body'>
          <ServerInput isRequired={true} placeholder={translate('server.group.name') + '*'}
            inputValue={this.state.name} inputName='name' inputType='text'
            inputAction={this.handleInputLine}/>
          <InlineAddRemoveDropdown name='networks' options={networkModel}
            values={this.state.networks} defaultOption={networkDefaultOption}
            sendSelectedList={this.getSelectedNetworks}/>
          <InlineAddRemoveDropdown name='serverGroups' options={serverGroupModel}
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
    );
  }
}

export function getServerGroupIndex(model, name) {
  return model.getIn(['inputModel','server-groups']).findIndex(
    serverGroup => serverGroup.get('name') === name);
}

export default ServerGroupDetails;
