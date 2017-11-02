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
import { translate } from '../../localization/localize.js';
import BaseServerDetails from './BaseServerDetails.js';

class SmServerDetails extends BaseServerDetails {
  constructor(props) {
    super(props);
    this.details = this.props.details ? this.getDetailsData(this.props.details) : undefined;
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

  getDetailsData = (details) => {
    let retData = {};
    let nkdevice = details.network_devices.find((device) => {
      return device.interface === 'eth0';
    });
    retData.overview = [{
      hostname: details.name,
      ip: nkdevice.ip
    },{
      id: details.id,
      ipv6: nkdevice.ipv6 ? nkdevice.ipv6[0].address : ''
      //kernel: '' //TODO ???
    }];
    retData.general = [{
      model: details.cpu_info.model,
      cores: details.cpu_info.count,
      ram: parseFloat(details.ram / 1024).toFixed(2)
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
      ipTable: this.getIpTableData('ip', details.network_devices),
      ipv6Table: this.getIpTableData('ipv6', details.network_devices)
    };

    //TODO where to get storage
    return retData;
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

  renderDetailsFromServer = () => {
    if(this.props.details) {
      return (
        <div>
          {this.renderOverview()}
          {this.renderGeneralInfo()}
          {this.renderNetworkingHeading()}
          {this.renderNetworkingTable('ipv4')}
          {this.details.networking.ipv6Table && this.renderNetworkingTable('ipv6')}
        </div>
      );
    }
  }

  render() {
    return (<div>{this.renderDetailsContent()}</div>);
  }
}

export default SmServerDetails;
