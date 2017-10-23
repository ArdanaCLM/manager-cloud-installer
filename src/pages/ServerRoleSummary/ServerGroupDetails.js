import React, { Component } from 'react';
import { fromJS } from 'immutable';
import { translate } from '../../localization/localize.js';
import { ServerInput, ServerDropdown } from '../../components/ServerUtils.js';
import { ActionButton } from '../../components/Buttons.js';
import { InlineAddRemoveDropdown } from '../../components/InlineAddRemoveFields.js';

class ServerGroupDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      networks: [],
      serverGroups: [],
      completeData: false
    };
    this.selectedNetwork = '';
    this.selectedServerGroup = '';
  }

  handleInputLine = (e, valid, props) => {
    let value = e.target.value;
    console.log('handleInputLine: ' + value);
    this.setState({name: value});
  }

  getSelectedNetworks = (list) => {
    this.setState({networks: list});
  }

  getSelectedServerGroups = (list) => {
    this.setState({serverGroups: list});
  }

  saveServerGroup = () => {
    let serverGroup = {
      'name': this.state.name,
      'networks': this.state.networks,
      'server-groups': this.state.serverGroups
    };
    let model = this.props.model;
    model = model.updateIn(['inputModel', 'server-groups'], list => list.push(fromJS(serverGroup)));
//    this.props.updateGlobalState('model', model);
    this.props.closeAction();
  }

  checkCompleteData = () => {
    console.log('this.state.name: ' + this.state.name);
    console.log('this.state.networks: ' + this.state.networks);
    console.log('this.state.networks.length: ' + this.state.networks.length);
    console.log('this.state.serverGroups: ' + this.state.serverGroups);
    console.log('this.state.serverGroups.length: ' + this.state.serverGroups.length);
    if ((this.state.networks.length > 0 || this.state.serverGroups.length > 0) &&
         this.state.name !== '') {
      console.log('checkCompleteDate: true');
      return true;
    } else {
      console.log('checkCompleteDate: false');
      return false;
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

    return (
      <div className='details-section'>
        <div className='details-header'>{translate('add.server.group')}</div>
        <div className='details-body'>
          <ServerInput isRequired={true} placeholder={translate('server.group.name') + '*'}
            inputValue='' inputName='name' inputType='text' inputAction={this.handleInputLine}/>
          <InlineAddRemoveDropdown name='networks' options={networkModel}
            defaultOption={networkDefaultOption} sendSelectedList={this.getSelectedNetworks}/>
          <InlineAddRemoveDropdown name='serverGroups' options={serverGroupModel}
            defaultOption={serverGroupDefaultOption}
            sendSelectedList={this.getSelectedServerGroups}/>
          <div className='btn-row details-btn'>
            <div className='btn-container'>
              <ActionButton key='cancel' type='default' clickAction={this.props.closeAction}
                displayLabel={translate('cancel')}/>
              <ActionButton key='save' clickAction={this.saveServerGroup}
                displayLabel={translate('save')} isDisabled={!this.checkCompleteData()}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ServerGroupDetails;
