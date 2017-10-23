import React from 'react';
import { translate } from '../../localization/localize.js';
import BaseServerDetails from './BaseServerDetails.js';

class OvServerDetails extends BaseServerDetails {
  constructor(props) {
    super(props);
    this.details = this.props.details ? this.getDetailsData(this.props.details) : undefined;
  }

  getDetailsData = (details) => {
    let retData = {};

    retData.overview = [{
      hostname: details.name,
      status: details.status
    }, {
      state: details.state,
      powerstate: details.powerState
    }];

    retData.general = [{
      model: details.model,
      uuid: details.uuid,
      cores: details.processorCoreCount
    }, {
      serialnumber: details.serialNumber,
      cpcount: details.processorCount,
      cpspeed: parseFloat(details.processorSpeedMhz / 1000).toFixed(1)
    },{
      productid: details.partNumber,
      processortype: details.processorType,
      memory: parseFloat(details.memoryMb / 1024).toFixed(2)
    }];

    retData.ilo = {
      hostname: details.mpHostInfo.mpHostName,
      ipTable: details.mpHostInfo.mpIpAddresses
    };

    //TODO process networking when have sample data
    if(details.portMap) {
      retData.networking = [];
    }

    return retData;
  }

  renderILOTable() {
    let keys = ['address', 'type'];
    let tableData = this.details.ilo.ipTable;

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

  renderNetworkTable() {
    if(!this.details.networking) {
      return (
        <div className='panel panel-default'>
          <table className='table table-condensed' width='90%' cellSpacing='0'>
            <tbody><tr><td>{translate('common.nodata')}</td></tr></tbody>
          </table>
        </div>
      );
    }
    else {
      //TODO
    }
  }

  renderILOHeading() {
    return (
      <div className='panel panel-default'>
        <div className='panel-heading'>
          <h4>{translate('server.details.ilo') + ' ' + this.details.ilo.hostname}</h4>
        </div>
      </div>
    );
  }

  renderDetailsFromServer = () => {
    if(this.props.details) {
      return (
        <div>
          {this.renderOverview()}
          {this.renderGeneralInfo()}
          {this.renderILOHeading()}
          {this.renderILOTable()}
          {this.renderNetworkingHeading()}
          {this.renderNetworkTable()}
        </div>
      );
    }
  }

  render() {
    return (<div>{this.renderDetailsContent()}</div>);
  }
}

export default OvServerDetails;
