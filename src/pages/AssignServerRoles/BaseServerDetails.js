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
import { Tabs, Tab } from 'react-bootstrap';
import { translate } from '../../localization/localize.js';
import ModelServerDetails from './ModelServerDetails.js';

const DETAILS_FROM_SERVER_TAB = 1;
const DETAILS_FROM_MODEL_TAB = 2;

class BaseServerDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {selectedTabKey: DETAILS_FROM_SERVER_TAB};
  }

  getUnit(key) {
    if(key === 'memory' || key === 'ram') {
      return 'GB';
    }
    else if(key === 'swap') {
      return 'MB';
    }
    else if(key === 'cpspeed') {
      return 'GHz';
    }
    else {
      return '';
    }
  }

  renderOverviewTable() {
    let rows = [];
    let sections = this.details.overview;
    sections.forEach((section, idx) => {
      let keys = Object.keys(section);
      rows.push (
        <tr key={idx}>
          <th>{translate('server.details.' + keys[0])}</th>
          <td>{section[keys[0]]}</td>
          <th>{translate('server.details.' + keys[1])}</th>
          <td>{section[keys[1]]}</td>
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
          <td>{section[keys[0]] + ' ' + this.getUnit(keys[1])}</td>
          <th>{translate('server.details.' + keys[1])}</th>
          <td>{section[keys[1]] + ' ' + this.getUnit(keys[1])}</td>
          <th>{translate('server.details.' + keys[2])}</th>
          <td>{section[keys[2]] + ' ' + this.getUnit(keys[2])}</td>
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
    //implemented by child
  }

  renderDetailsFromModel = () => {
    return (<ModelServerDetails data={this.props.data}/>);
  }

  handleSelectTab = (tabKey) =>  {
    this.setState({selectedTabKey: tabKey});
  }

  renderDetailsContent() {
    if (this.props.tableId === 'rightTableId') {
      return (
        <Tabs
          activeKey={this.state.selectedTabKey}
          onSelect={this.handleSelectTab} id={this.props.tableId + this.props.source}>
          <Tab
            eventKey={DETAILS_FROM_SERVER_TAB} title={translate('server.details.from.server')}>
            {this.state.selectedTabKey === DETAILS_FROM_SERVER_TAB && this.renderDetailsFromServer()}
          </Tab>
          <Tab
            eventKey={DETAILS_FROM_MODEL_TAB} title={translate('server.details.from.model')}>
            {this.state.selectedTabKey === DETAILS_FROM_MODEL_TAB && this.renderDetailsFromModel()}
          </Tab>
        </Tabs>
      );
    }
    else {
      return (this.renderDetailsFromServer());
    }
  }
}

export default BaseServerDetails;
