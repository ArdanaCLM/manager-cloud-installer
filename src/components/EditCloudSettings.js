import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import { Tabs, Tab } from 'react-bootstrap';
import { ConfirmModal } from '../components/Modals.js';
import { ActionButton } from '../components/Buttons.js';
import { alphabetically } from '../utils/Sort.js';

const TAB = {
  NIC_MAPPINGS: 'NIC_MAPPINGS',
  SERVER_GROUPS: 'SERVER_GROUPS',
  NETWORKS: 'NETWORKS'
};

class EditCloudSettings extends Component {

  constructor(props) {
    super(props);
    this.state = {
      key: TAB.NIC_MAPPINGS
    };
  }

  addNicMapping = (e) => {
    console.log('addNicMapping');
  }
  editNicMapping = (e) => {
    console.log('editNicMapping');
  }

  addServerGroup = (e) => {
    console.log('addServerGroup');
  }
  editServerGroup = (e) => {
    console.log('editServerGroup');
  }

  addNetwork = (e) => {
    console.log('addNetwork');
  }
  editNetwork = (e) => {
    console.log('editNetwork');
  }


  renderNicMappingTab() {
    const rows = this.props.model.getIn(['inputModel','nic-mappings'])
      .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
      .map((m,idx) => {
        const numPorts = m.get('physical-ports').size;
        return (
          <tr key={idx}>
            <td>{m.get('name')}</td>
            <td>{numPorts}</td>
            <td><span onClick={(e) => this.editNicMapping(e)} className='glyphicon glyphicon-pencil edit'></span></td>
          </tr>);
      });

    return (
      <div>
        <div className='button-box'>
          <div>
            <ActionButton displayLabel={translate('add.nic.mapping')} clickAction={(e) => this.addNicMapping(e)} />
          </div>
        </div>
        <table className='table'>
          <thead>
            <tr>
              <th>{translate('nic.mapping.name')}</th>
              <th>{translate('number.ports')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  }

  renderServerGroupsTab() {
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

        return (
          <tr key={idx}>
            <td>{m.get('name')}</td>
            <td>{numNetworks}</td>
            <td>{numServerGroups}</td>
            <td><span onClick={(e) => this.editServerGroup(e)} className='glyphicon glyphicon-pencil edit'></span></td>
          </tr>);
      });

    return (
      <div>
        <div className='button-box'>
          <div>
            <ActionButton displayLabel={translate('add.server.group')} clickAction={(e) => this.addServerGroup(e)} />
          </div>
        </div>
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
          </tbody>
        </table>
      </div>
    );
  }


  renderNetworksTab() {
    const trueStr = translate("true");
    const falseStr = translate("false");

    const rows = this.props.model.getIn(['inputModel','networks'])
      .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
      .map((m,idx) => {
        return (
          <tr key={idx}>
            <td>{m.get('name')}</td>
            <td>{m.get('vlanid')}</td>
            <td>{m.get('cidr')}</td>
            <td>{m.get('gateway-ip')}</td>
            <td>{m.get('tagged-vlan') ? trueStr : falseStr}</td>
            <td><span onClick={(e) => this.editNetwork(e)} className='glyphicon glyphicon-pencil edit'></span></td>
          </tr>);
      });

    return (
      <div>
        <div className='button-box'>
          <div>
            <ActionButton displayLabel={translate('add.network')} clickAction={(e) => this.addNetwork(e)} />
          </div>
        </div>
        <table className='table'>
          <thead>
            <tr>
              <th>{translate('network')}</th>
              <th>{translate('vlanid')}</th>
              <th>{translate('cidr')}</th>
              <th>{translate('gateway')}</th>
              <th>{translate('tagged.vlan')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  }


  render() {
    return (
      <ConfirmModal
        show={this.props.show}
        title={translate('edit.cloud.settings')}
        className={'cloud-settings'}
        onHide={this.props.onHide}>

        <Tabs id='editCloudSettings' activeKey={this.state.key} onSelect={(tabKey) => {this.setState({key: tabKey});}}>
          <Tab eventKey={TAB.NIC_MAPPINGS} title={translate('edit.nic.mappings')}>
            {this.renderNicMappingTab()}
          </Tab>
          <Tab eventKey={TAB.SERVER_GROUPS} title={translate('edit.server.groups')}>
            {this.renderServerGroupsTab()}
          </Tab>
          <Tab eventKey={TAB.NETWORKS} title={translate('edit.networks')}>
            {this.renderNetworksTab()}
          </Tab>
        </Tabs>

      </ConfirmModal>
    );
  }
}

export { EditCloudSettings };