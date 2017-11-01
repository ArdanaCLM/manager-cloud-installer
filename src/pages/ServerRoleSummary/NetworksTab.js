// (c) Copyright 2017 SUSE LLC
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
    this.setState({mode : MODE.NONE});
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
    let bottomClass = 'bottom-action-row';
    bottomClass = this.state.mode === MODE.ADD ? bottomClass + ' on' : bottomClass;
    let arrowClass = 'triangle-right';
    arrowClass = this.state.mode === MODE.ADD ? arrowClass + ' on' : arrowClass;
    return (
      <div className='bottom-action-container'>
        <div key='networkAction' className={bottomClass}>
          <span><i className={addClass} onClick={() => this.handleAddNetwork()}>add_circle</i>
            {translate('add.network')}</span>
        </div><div className={arrowClass}></div>
      </div>
    );
  }

  renderUpdateNetworkSection() {
    if (this.state.mode !== MODE.NONE) {
      let theProps = {};
      if(this.state.mode === MODE.EDIT) {
        theProps.networkName = this.state.networkName;
      }
      return (
        <UpdateNetworks ref={'updateNetwork' + this.state.mode}
          model={this.props.model} mode={this.state.mode} {...theProps}
          updateGlobalState={this.props.updateGlobalState}
          closeAction={this.handleCancelUpdateNetwork}/>
      );
    }
    else {
      return (
        <div className='details-section network-section'>
          <div className='no-options'>{translate('no.options.available')}</div>
        </div>
      );
    }
  }

  renderNetworkTable() {
    let trueStr = translate('true');
    let falseStr = translate('false');
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
            <td>{network.get('tagged-vlan') ? trueStr : falseStr}</td>
            <td>
              <div className='row-action-container'>
                <span onClick={() => this.handleEditNetwork(network)} className={editClass} />
                <span onClick={() => this.handleConfirmDeleteNetwork(network)} className={removeClass}/>
              </div>
            </td>
          </tr>
        );
      });
    return (
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
        <tbody>{rows}</tbody>
      </table>
    );
  }

  render() {
    return (
      <div className='network'>
        <div className='network-container'>
          <div className='network-table-container verticalLine'>
            {this.renderNetworkTable()}
          </div>
          <div className='network-update-container'>
            {this.renderUpdateNetworkSection()}
          </div>
        </div>
        {this.renderActionRow()}
        {this.renderRemoveConfirmation()}
      </div>
    );
  }
}
export default NetworksTab;
