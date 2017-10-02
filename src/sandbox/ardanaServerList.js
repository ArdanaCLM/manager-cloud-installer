import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import BaseWizardPage from '../pages/BaseWizardPage';
import { ActionButton } from '../components/Buttons.js';

class ArdanaServerList extends BaseWizardPage {
  constructor() {
    super();
    this.state = {
      ardanaServiceUrl : 'https://192.168.245.10',//point this to your own system to avoid re-entering in the UI
      ardanaServicePort: '9085',
      keystoneToken: '',
      ardanaServiceQuery: '/api/v1/hlm/model/cp_output/server_info_yml',
      serverData: '',
      queryList: []
    };
  }

  updateServiceUrl(e) {
    this.setState({ardanaServiceUrl: e.target.value});
  }

  updateServicePort(e) {
    this.setState({ardanaServicePort: e.target.value});
  }

  updateKeystoneToken(e) {
    this.setState({keystoneToken: e.target.value});
  }

  updateServiceQuery(e) {
    this.setServiceQuery(e.target.value);
  }

  setServiceQuery(value) {
    this.setState({ardanaServiceQuery: value});
  }

  triggerQuery(/*e*/) {
    var queryHeaders = new Headers();
    queryHeaders.append('X-Auth-Token', this.state.keystoneToken);
    var queryInit  = {
      method: 'GET',
      headers: queryHeaders,
      mode: 'cors',
      cache: 'default'
    };
    var fullArdanaUrl = this.state.ardanaServiceUrl + ':' +
                        this.state.ardanaServicePort +
                        this.state.ardanaServiceQuery;
    fetch(fullArdanaUrl, queryInit)
      .then(response => response.json())
      .then((responseData) =>
      {
        this.logResponse(responseData);
        this.setState({
          serverData: JSON.stringify(responseData, null, 2),
          queryList: []
        });
      });
  }

  showQueryList() {
    var queryJson = require('./querylist.json');
    this.setState({serverData: '',
      queryList: queryJson});
  }

  logResponse(data) {
    console.log(JSON.stringify(data));
  }

  render() {
    return (
      <div className='generic-container'>
        {this.renderHeading('Ardana Service Access page')}
        <p>
          Ardana Service URL: <input type='text' className='longInput'
            onChange={this.updateServiceUrl.bind(this)}
            defaultValue={this.state.ardanaServiceUrl} />
          <br/>
          Ardana Service Port: <input type='text'
            onChange={this.updateServicePort.bind(this)}
            defaultValue={this.state.ardanaServicePort} />
          <br/>
          Keystone Token: <input type='text' className='longInput'
            onChange={this.updateKeystoneToken.bind(this)}
            defaultValue={this.state.keystoneToken} />
          <br/>
          Query: <input type='text' className='longInput'
            onChange={this.updateServiceQuery.bind(this)}
            value={this.state.ardanaServiceQuery}/>
          <br/>
          <ActionButton clickAction={this.setServiceQuery.bind(this, '/api/v1/hlm/heartbeat')}
            displayLabel='Heartbeat' />
          <ActionButton clickAction={this.setServiceQuery.bind(this, '/api/v1/hlm/model/cp_output/server_info_yml')}
            displayLabel='Servers' />
          <ActionButton clickAction={this.setServiceQuery.bind(this, '/api/v1/hlm/templates')}
            displayLabel='Templates' />
          <ActionButton clickAction={this.setServiceQuery.bind(this, '/api/v1/hlm/model')}
            displayLabel='Model' />
          <ActionButton clickAction={this.setServiceQuery.bind(this, '/api/v1/hlm/model/history')}
            displayLabel='Model History' />
          <br/><br/>
          The url and port can be found with 'openstack endpoint list'.<br/>
          Keystone token generation is 'openstack token issue'<br/>
        </p>
        <p>
          {translate('ardana.url.port', this.state.ardanaServiceUrl, this.state.ardanaServicePort)}<br/>
          current url: {this.state.ardanaServiceUrl}<br/>
          current port: {this.state.ardanaServicePort}<br/>
          {translate('keystone.token')}: {this.state.keystoneToken}<br/>
          query: {this.state.ardanaServiceQuery}
        </p>
        <ActionButton clickAction={this.triggerQuery.bind(this)}
          displayLabel="Run Query"/>
        <ActionButton clickAction={this.showQueryList.bind(this)}
          displayLabel="List Known Queries"/>

        <pre>
          {this.state.serverData}
        </pre>

        <SimpleQueryList items={this.state.queryList}/>
        {this.renderNavButtons()}
      </div>
    );
  }
}


class SimpleQueryList extends Component {
  render() {
    var listItems = this.props.items.map(function(item) {
      return (
        <tr>
          <td id='{item.endpoint}'>{item.endpoint}</td>
          <td>{item.method}</td>
          <td>{item.description}</td>
        </tr>
      );
    });

    return (
      <div>
        <table>
          <tr style={{'font-weight': 'bold'}}>
            <td>endpoint</td>
            <td>method</td>
            <td>description</td>
          </tr>
          {listItems}
        </table>
      </div>
    );
  }
}


export default ArdanaServerList;
