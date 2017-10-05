import React, { Component } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import { translate } from '../localization/localize.js';
import ModelServerDetails from './ModelServerDetails.js';

const DETAILS_FROM_SERVER_TAB = 2;
const DETAILS_FROM_MODEL_TAB = 1;

class SmServerDetails extends Component {
  constructor(props) {
    super(props);
    this.details = this.getDetailsData(this.props.details); //re-organize the data for UI
    this.state = {selectedTabKey: DETAILS_FROM_MODEL_TAB};
  }

  getIpTableData(ipType, networks) {
    let retData = networks.map((network) => {
      //common part
      let data = {
        hardware_address: network.hardware_address,
        interface: network.interface,
        module: network.module
      };
      if(ipType === 'ip') {
        data.broadcast = network.broadcast;
        data.ipv4 = network.ip;
        data.netmask = network.netmask;
      }
      else { //TODO can have multiple ipv6 for one network device?
        if(!network.ipv6) {
          return undefined;
        }
        data.ipv6 = network.ipv6[0].address;
        data.netmask = network.ipv6[0].netmask;
        data.scope = network.ipv6[0].scope;
      }
      return data;
    });

    return retData;
  }

  getDetailsData(details) {
    let retData = {};
    let nkdevice = details.network_devices.find((device) => {
      return device.interface === 'eth0';
    });
    retData.overview = {
      hostname: details.name,
      ip: nkdevice.ip,
      ipv6: nkdevice.ipv6 ? nkdevice.ipv6[0].address : '',
      id: details.id,
      kernel: '' //TODO ???
    };
    retData.general = [{
      model: details.cpu_info.model,
      cores: details.cpu_info.count,
      ram: details.ram
    }, {
      arch: details.cpu_info.arch,
      cache: details.cpu_info.cache,
      swap: details.swap
    },{
      vendor: details.cpu_info.vendor,
      machineId: '',
      stepping: details.cpu_info.stepping
    }];

    retData.networking = {
      interfaces: details.network_devices.map((device) => {return device.interface;}),
      ipTable: this.getIpTableData('ip', details.network_devices),
      ipv6Table: this.getIpTableData('ipv6', details.network_devices)
    };

    //TODO where to get storage
    return retData;
  }

  handleSelectTab = (tabKey) =>  {
    this.setState({selectedTabKey: tabKey});
  }

  renderOverviewTable() {
    let rows = [];
    let keys = Object.keys(this.details.overview);
    keys.forEach((key, idx) => {
      rows.push (
        <tr key={idx}>
          <th>{translate('server.details.' + key)}</th>
          <td>{this.details.overview[key]}</td>
        </tr>);
    });
    return (
      <table className='table table-condensed'>
        <tbody>{rows}</tbody>
      </table>
    );
  }

  renderOverview() {
    return (
      <div className='panel panel-default'>
        <div className='panel-heading'>
          <h4>{translate('server.details.overview')}</h4>
        </div>
        <div className='table table-responsive'>{this.renderOverviewTable()}</div>
      </div>
    );
  }

  renderGeneralTable() {
    let rows = [];
    let sections = this.details.general;
    sections.forEach((section, idx) => {
      let keys = Object.keys(section);
      rows.push (
        <tr key={idx}>
          <th>{translate('server.details.' + keys[0])}</th>
          <td>{section[keys[0]]}</td>
          <th>{translate('server.details.' + keys[1])}</th>
          <td>{section[keys[1]]}</td>
          <th>{translate('server.details.' + keys[2])}</th>
          <td>{section[keys[2]]}</td>
        </tr>);
    });

    return (
      <table className='table table-condensed'>
        <tbody>{rows}</tbody>
      </table>
    );
  }

  renderGeneralInfo() {
    return (
      <div className='panel panel-default'>
        <div className='panel-heading'>
          <h4>{translate('server.details.general')}</h4>
        </div>
        <div className='table table-responsive'>{this.renderGeneralTable()}</div>
      </div>
    );
  }

  renderNetworkingTable(type) {
    let keys = undefined;
    let tableData = undefined;
    if(type === 'ipv4') {
      tableData = this.details.networking.ipTable;
      keys = [
        'interface', 'ipv4', 'netmask', 'broadcast', 'hardware_address', 'module'
      ];
    }
    else { //ipv6
      tableData = this.details.networking.ipv6Table;
      //if don't ave ipv6, don't render
      if(!tableData) {
        return null;
      }
      keys = [
        'interface', 'ipv6', 'netmask', 'scope', 'hardware_address', 'module'
      ];
    }
    let tableHeaders = keys.map((header, idx) => {
      return (<th key={idx}>{translate('server.details.header.' + header)}</th>);
    });

    let rows = tableData.map((rowData, idx) => {
      let cols = keys.map((key, index) => {
        return (<td key={index}>{rowData[key]}</td>);
      });
      return (
        <tr key={idx}>{cols}</tr>
      );
    });
    return (
      <div className='panel panel-default'>
        <table className='table table-condensed' width='90%' cellSpacing='0'>
          <thead><tr>{tableHeaders}</tr></thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  }

  renderNetworkingHeading() {
    return (
      <div className='panel panel-default'>
        <div className='panel-heading'>
          <h4>{translate('server.details.networking')}</h4>
        </div>
      </div>
    );
  }

  renderDetailsFromServer = () => {
    return (
      <div>
        {this.renderOverview()}
        {this.renderGeneralInfo()}
        {this.renderNetworkingHeading()}
        {this.renderNetworkingTable('ipv4')}
        {this.renderNetworkingTable('ipv6')}
      </div>
    );
  }

  renderDetailsFromModel = () => {
    return (<ModelServerDetails data={this.props.data}/>);
  }

  renderDetailsContent() {
    if (this.props.tableId === 'rightTableId') {
      return (
        <Tabs
          activeKey={this.state.selectedTabKey}
          onSelect={this.handleSelectTab} id='SmServerDetailsTabsId'>
          <Tab
            eventKey={DETAILS_FROM_MODEL_TAB} title={translate('server.details.from.model')}>
            {this.state.selectedTabKey === DETAILS_FROM_MODEL_TAB && this.renderDetailsFromModel()}
          </Tab>
          <Tab
            eventKey={DETAILS_FROM_SERVER_TAB} title={translate('server.details.from.server')}>
            {this.state.selectedTabKey === DETAILS_FROM_SERVER_TAB && this.renderDetailsFromServer()}
          </Tab>
        </Tabs>
      );
    }
    else {
      return (this.renderDetailsFromServer());
    }
  }

  render() {
    return (<div>{this.renderDetailsContent()}</div>);
  }
}

export default SmServerDetails;
