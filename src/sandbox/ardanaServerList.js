import React, { Component } from 'react';
import '../App.css';

class ArdanaServerList extends Component {
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

    updateServiceUrl( e ){
        this.setState({ardanaServiceUrl: e.target.value});
    }

    updateServicePort( e ){
        this.setState({ardanaServicePort: e.target.value});
    }

    updateKeystoneToken( e ){
        this.setState({keystoneToken: e.target.value});
    }

    updateServiceQuery( e ){
        this.setServiceQuery(e.target.value);
    }

    setServiceQuery( value ){
        this.setState({ardanaServiceQuery: value});
    }

    triggerQuery( e ){
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
        fetch( fullArdanaUrl , queryInit)
            .then( response => response.json())
            .then( (responseData) =>
            {
                this.logResponse(responseData);
                this.setState({serverData: JSON.stringify(responseData, null, 2),
                               queryList: []});
            })
    }

    showQueryList(){
        var queryJson = require("./querylist.json");
        this.setState({serverData: '',
            queryList: queryJson});
    }

    logResponse( data ){
        console.log( JSON.stringify(data));
    }

    render() {
        return (
            <div className="ArdanaServerList">
                <div>
                    <h3>Ardana Service Access page</h3>
                </div>
                <p>
                    Ardana Service URL: <input type="text" className="longInput"
                        onChange={this.updateServiceUrl.bind(this)}
                        defaultValue={this.state.ardanaServiceUrl} />
                    <br/>
                    Ardana Service Port: <input type="text"
                        onChange={this.updateServicePort.bind(this)}
                        defaultValue={this.state.ardanaServicePort} />
                    <br/>
                    Keystone Token: <input type="text" className="longInput"
                        onChange={this.updateKeystoneToken.bind(this)}
                        defaultValue={this.state.keystoneToken} />
                    <br/>
                    Query: <input type="text" className="longInput"
                        onChange={this.updateServiceQuery.bind(this)}
                        value={this.state.ardanaServiceQuery}/>
                    <br/>
                    <button onClick={this.setServiceQuery.bind(this, "/api/v1/hlm/model/cp_output/server_info_yml")}>
                        Servers
                    </button>
                    <button onClick={this.setServiceQuery.bind(this, "/api/v1/hlm/templates")}>
                        Templates
                    </button>
                    <button onClick={this.setServiceQuery.bind(this, "/api/v1/hlm/model")}>
                        Model
                    </button>
                    <button onClick={this.setServiceQuery.bind(this, "/api/v1/hlm/model/history")}>
                        Model History
                    </button>
                    <br/><br/>
                    The url and port can be found with "openstack endpoint list".<br/>
                    Keystone token generation is "openstack token issue"<br/>
                </p>
                <p> current url: {this.state.ardanaServiceUrl}<br/>
                current port: {this.state.ardanaServicePort}<br/>
                keystone token: {this.state.keystoneToken}<br/>
                query: {this.state.ardanaServiceQuery}</p>
                <button onClick={this.triggerQuery.bind(this)}>Run Query</button>
                <button onClick={this.showQueryList.bind(this)}>List Known Queries</button>

                <pre>
                    {this.state.serverData}
                </pre>

                <SimpleQueryList items={this.state.queryList}/>
            </div>
            );
    }
}


class SimpleQueryList extends Component {
    render() {
        var listItems = this.props.items.map(function(item) {
            return (
                <div>
                    <table>
                        <tr>
                            <td>endpoint</td><td>{item.endpoint}</td>
                        </tr>
                        <tr>
                            <td>method</td><td>{item.method}</td>
                        </tr>
                        <tr>
                            <td>description</td><td>{item.description}</td>
                        </tr>
                    </table>
                    <br/><br/>
                </div>
            );
        });

        return (
            <div>
                    {listItems}
            </div>
        )
    }

}


export default ArdanaServerList;