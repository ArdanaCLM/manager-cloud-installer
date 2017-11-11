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
import '../Deployer.css';
import Cookies from 'universal-cookie';
import { Tabs, Tab } from 'react-bootstrap';
import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import { ActionButton, LoadFileButton } from '../components/Buttons.js';
import { IpV4AddressValidator, MacAddressValidator } from '../utils/InputValidators.js';
import { SearchBar, ServerRolesAccordion, ServerInputLine, ServerDropdownLine } from '../components/ServerUtils.js';
import { BaseInputModal, ConfirmModal } from '../components/Modals.js';
import BaseWizardPage from './BaseWizardPage.js';
import ConnectionCredsInfo from './AssignServerRoles/ConnectionCredsInfo';
import { ErrorMessage } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';
import ServerTable from '../components/ServerTable.js';
import ViewServerDetails from './AssignServerRoles/ViewServerDetails';
import EditServerDetails from '../components/EditServerDetails.js';
import { importCSV } from '../utils/CsvImporter.js';
import { fromJS } from 'immutable';
import { isEmpty } from 'lodash';
import { getServerRoles, isRoleAssignmentValid,  getNicMappings, getServerGroups } from '../utils/ModelUtils.js';

const AUTODISCOVER_TAB = 1;
const MANUALADD_TAB = 2;
const COOKIES = new Cookies();

class AssignServerRoles extends BaseWizardPage {

  constructor(props) {
    super(props);

    // TODO: Move the Add Server model into its own component and
    // let it track its own state
    this.newServer = {
      'source': 'manual',
      'id': '',
      'name': '',
      'ip-addr': '',
      'server-group': '',
      'nic-mapping': '',
      'role': '',
      'ilo-ip': '',
      'ilo-user': '',
      'ilo-password': '',
      'mac-addr': ''
    };

    this.connections = this.props.connectionInfo ? this.props.connectionInfo : {
      sm: {checked: false, secured: true},
      ov: {checked: false, secured: true}
    };
    this.smApiToken = undefined;
    this.smSessionKey = undefined;
    this.ovSessionKey = undefined;
    this.forcePromtCreds = false;

    this.state = {
      //server list on the available servers side
      //could be filtered
      serversAddedManually: [],
      rawDiscoveredServers: [],

      //when move servers the filter text could be cleared
      searchFilterText: '',

      //which tab key selected
      selectedServerTabKey: AUTODISCOVER_TAB,

      //show or not credentials modal
      showCredsModal: false,

      // Add Server Manually modal
      showAddServerManuallyModal: false,

      // TODO: Separate the manual modal into its own component and track its validity internally
      validAddServerManuallyForm: false,

      //when loading data or saving data
      loading: false,

      // error messages
      messages: [],

      //show server details modal
      showServerDetailsModal: false,

      // show edit server details modal
      showEditServerModal: false,

      // active row data to pass into details modal
      activeRowData: undefined
    };
  }

  getSmServersData(tokenKey, smUrl) {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/sm/servers', {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Auth-Token': tokenKey,
          'Suse-Manager-Url': smUrl
        }
      })
        .then((response) => this.checkResponse(response))
        .then(response => response.json())
    );
  }

  getOvServersData(tokenKey, ovUrl) {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/ov/servers', {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Auth-Token': tokenKey,
          'Ov-Url': ovUrl,
          'Secured': this.connections.ov.secured
        }
      })
        .then((response) => this.checkResponse(response))
        .then(response => response.json())
    );
  }

  discoverSmServers(tokenKey, smUrl) {
    let promise = new Promise((resolve, reject) => {
      this.getSmServersData(tokenKey, smUrl)
        .then((rawServerData) => {
          if (rawServerData && rawServerData.length > 0) {
            let ids = rawServerData.map((srv) => {
              return srv.id;
            });

            this.getSmAllServerDetailsData(ids, tokenKey, smUrl)
              .then((details) => {
                rawServerData =
                  this.updateSmServerDataWithDetails(details, rawServerData);
                resolve(rawServerData);
              });
          }
          else {
            resolve([]);
          }
        })
        .catch((error) => {
          let msg = translate('server.discover.sm.error');
          this.setState(prev => { return {
            messages: prev.messages.concat([{msg: [msg, error.toString()]}])
          };});
          reject(error);
        });
    });
    return promise;
  }

  discoverOvServers(tokenKey, ovUrl) {
    let promise = new Promise((resolve, reject) => {
      this.getOvServersData(tokenKey, ovUrl)
        .then((rawServerData) => {
          if (rawServerData && rawServerData.members && rawServerData.members.length > 0) {
            let servers = this.updateOvServerData(rawServerData.members);
            resolve(servers);
          }
          else {
            resolve([]);
          }
        })
        .catch((error) => {
          let msg = translate('server.discover.ov.error');
          this.setState(prev => { return {
            messages: prev.messages.concat([{msg: [msg, error.toString()]}])
          };});
          reject(error);
        });
    });
    return promise;
  }

  //run discovery for suse manager and/or hpe oneview parallelly
  //meanwhile also go update the table data with more details by query
  //detail one by one in parallel.
  discoverAllServers = () => {
    let tasks = [];
    if(this.connections.sm.checked && this.smSessionKey) {
      tasks.push(this.discoverSmServers(this.smSessionKey, this.connections.sm.apiUrl));
    }
    else if(this.smApiToken) {
      tasks.push(this.discoverSmServers(this.smApiToken, this.getSmUrlEmbedded()));
    }

    if(this.connections.ov.checked && this.ovSessionKey) {
      tasks.push(this.discoverOvServers(this.ovSessionKey, this.connections.ov.apiUrl));
    }

    return Promise.all(tasks);
  }

  checkResponse(response) {
    if (!response.ok) {
      throw Error(response.url + ': ' + response.statusText);
    }
    return response;
  }

  saveAllDiscoveredServers(servers) {
    this.deleteDiscoveredServers()
      .then((response) => {
        this.saveDiscoveredServers(servers)
          .then((response) => {})
          .catch((error) => {
            let msg = translate('server.discover.save.error');
            this.setState(prev => { return {
              messages: prev.messages.concat([{msg: [msg, error.toString()]}])
            };});
          });
      })
      .catch((error) => {
        let msg = translate('server.discover.delete.error');
        this.setState(prev => { return {
          messages: prev.messages.concat([{msg: [msg, error.toString()]}])
        };});
      });
  }

  handleDiscovery = () => {
    if(this.connections.sm.checked) {
      let sKey = COOKIES.get('suseManagerSessionKey');
      this.smSessionKey = sKey; //key or undefined
    }

    if(this.connections.ov.checked) {
      let oKey = COOKIES.get('oneViewSessionKey');
      this.ovSessionKey = oKey; //key or undefined
    }

    if((!this.smApiToken && this.connections.sm.checked && !this.smSessionKey) ||
      (this.connections.ov.checked && !this.ovSessionKey)) {
      //don't have session keys...need inputs
      this.setState({showCredsModal: true});
      this.forcePromtCreds = true;
    }
    else {
      this.setState({loading: true, messages: []});
      let resultServers = [];
      this.discoverAllServers()
        .then((allServerData) => {
          allServerData.forEach((oneSet, idx) => {
            resultServers = resultServers.concat(oneSet);
          });
          resultServers = this.sortServersByName(resultServers);
          this.saveAllDiscoveredServers(resultServers);
          this.setState({loading: false, rawDiscoveredServers: resultServers});
        })
        .catch((error) => {
          this.setState({loading: false});
        });
    }
  }

  //handle filter text change
  handleSearchText = (filterText) => {
    this.setState({searchFilterText: filterText});
  }

  handleSelectServerTab = (tabKey) =>  {
    this.setState({selectedServerTabKey: tabKey});
  }

  handleAddServerManually = () => {
    this.setState({showAddServerManuallyModal: true});
  }

  renderInputLine = (required, title, name, type, validator) => {
    return (
      <ServerInputLine isRequired={required} label={title} inputName={name}
        inputType={type} inputValidate={validator} inputAction={this.handleInputLine}
        inputValue={this.newServer[name]}/>
    );
  }

  handleInputLine = (e, valid, props) => {
    let value = e.target.value;
    if (valid) {
      let key = props.inputName;
      if (key === 'name') {
        this.newServer.name = value;
        this.newServer.id = value;
      } else {
        this.newServer[key] = value;
      }

      if (this.newServer.name && this.newServer['ip-addr']) {
        this.setState({validAddServerManuallyForm: true});
      }
    } else {
      this.setState({validAddServerManuallyForm: false});
    }
  }

  renderDropdownLine(required, title, name, list, handler, defaultOption) {
    return (
      <ServerDropdownLine label={title} name={name} value={this.newServer[name]} optionList={list}
        isRequired={required} selectAction={handler} defaultOption={defaultOption}/>
    );
  }

  handleSelectRole = (role) => {
    this.newServer.role = role;
  }

  handleSelectGroup = (group) => {
    this.newServer['server-group'] = group;
  }

  handleSelectNicMapping = (nicmapping) => {
    this.newServer['nic-mapping'] = nicmapping;
  }

  closeAddServerManuallyModal = () => {
    this.setState({showAddServerManuallyModal: false});
  }

  cancelAddServerManuallyModal = () => {
    this.resetAddServerManuallyModal();
    this.closeAddServerManuallyModal();
  }

  saveServersAddedManually = (serverList) => {

    // if role is provided, add server to the model
    let model = this.props.model;

    serverList.forEach(server => {
      if (server.role) {
        model = model.updateIn(['inputModel', 'servers'], list => list.push(fromJS(server)));
      }
    });
    this.props.updateGlobalState('model', model);

    fetch(getAppConfig('shimurl') + '/api/v1/server', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serverList)
    });

    // add server to the left table and the server API
    this.setState((prevState) => {
      return {serversAddedManually: prevState.serversAddedManually.concat(serverList)};
    }, this.resetAddServerManuallyModal);
  }

  resetAddServerManuallyModal = () => {
    this.newServer = {
      'source': 'manual',
      'id': '',
      'name': '',
      'ip-addr': '',
      'server-group': '',
      'nic-mapping': '',
      'role': '',
      'ilo-ip': '',
      'ilo-user': '',
      'ilo-password': '',
      'mac-addr': ''
    };
    this.setState({validAddServerManuallyForm: false});
  }

  addOneServer = () => {
    this.saveServersAddedManually([this.newServer]);
    this.closeAddServerManuallyModal();
  }

  addMoreServer = () => {
    this.saveServersAddedManually([this.newServer]);
  }

  renderAddServerManuallyModal = () => {
    const serverGroups = getServerGroups(this.props.model);
    const nicMappings = getNicMappings(this.props.model);
    let roles = getServerRoles(this.props.model).map(e => e['serverRole']);
    roles.unshift('');
    if (!this.newServer.role) {
      this.newServer.role = '';
    }
    if (!this.newServer['server-group']) {
      this.newServer['server-group'] = serverGroups[0];
    }
    if (!this.newServer['nic-mapping']) {
      this.newServer['nic-mapping'] = nicMappings[0];
    }
    let defaultOption = {
      label: translate('server.none.prompt'),
      value: ''
    };
    let footer = (
      <div className='btn-row'>
        <ActionButton type='default' clickAction={this.cancelAddServerManuallyModal}
          displayLabel={translate('cancel')}/>
        <ActionButton type='default' clickAction={this.addMoreServer} displayLabel={translate('add.more')}
          isDisabled={!this.state.validAddServerManuallyForm}/>
        <ActionButton clickAction={this.addOneServer} displayLabel={translate('save')}
          isDisabled={!this.state.validAddServerManuallyForm}/>
      </div>
    );
    return (
      <ConfirmModal show={this.state.showAddServerManuallyModal} title={translate('add.server.add')}
        className={'manual-discover-modal'} onHide={this.cancelAddServerManuallyModal} footer={footer}>

        <div className='server-details-container'>
          {this.renderInputLine(true, 'server.name.prompt', 'name', 'text')}
          {this.renderInputLine(true, 'server.ip.prompt', 'ip-addr', 'text', IpV4AddressValidator)}
          {this.renderDropdownLine(true, 'server.group.prompt', 'server-group',
            serverGroups, this.handleSelectGroup)}
          {this.renderDropdownLine(true, 'server.nicmapping.prompt', 'nic-mapping',
            nicMappings, this.handleSelectNicMapping)}
          {this.renderDropdownLine(false, 'server.role.prompt', 'role', roles,
            this.handleSelectRole, defaultOption)}
        </div>
        <div className='message-line'>{translate('server.ipmi.message')}</div>
        <div className='server-details-container'>
          {this.renderInputLine(false, 'server.mac.prompt', 'mac-addr', 'text', MacAddressValidator)}
          {this.renderInputLine(false, 'server.ipmi.ip.prompt', 'ilo-ip', 'text', IpV4AddressValidator)}
          {this.renderInputLine(false, 'server.ipmi.username.prompt', 'ilo-user', 'text')}
          {this.renderInputLine(false, 'server.ipmi.password.prompt', 'ilo-password', 'password')}
        </div>

      </ConfirmModal>
    );
  }

  sortServersByName(servers) {
    return servers.sort((a, b) => {
      let x = a.name;
      let y = b.name;
      return ((x < y) ? -1 : (x > y) ? 1 : 0);
    });
  }

  handleAddServerFromCSV = file => {
    const restrictions = {
      'server-role': getServerRoles(this.props.model).map(e => e['serverRole']),
      'server-groups': getServerGroups(this.props.model),
      'nic-mappings' : getNicMappings(this.props.model)
    };

    this.setState({messages: []});
    importCSV(file, restrictions, results => {
      // TODO: Display errors that may exists in results.errors
      for (let server of results.data) {
        server['source'] = 'manual';
        server['id'] = server['id'] || server['name'];
      }

      if (results.errors.length > 0) {
        const MAX_LINES = 5;

        let details = results.errors.slice(0, MAX_LINES);
        if (results.errors.length > MAX_LINES) {
          details.push('...');
        }

        let title = translate('csv.import.error');
        this.setState(prev => { return {
          messages: prev.messages.concat([{title: title, msg: details}])
        };});
      }

      this.saveServersAddedManually(results.data);
    });
  }

  handleConfDiscovery = () => {
    if(!this.smApiToken) {
      this.forcePromtCreds = false;
      this.setState({showCredsModal: true});
    }
    else {
      //if embedded don't show configuration
      this.handleDiscovery();
    }
  }

  handleCancelCredsInput = () => {
    this.setState({showCredsModal: false});
  }

  getSmUrl(host, port) {
    let url = 'https://' + host + ':' + (port <= 0 ? '8443' : port) + '/rpc/api';
    return url;
  }

  getSmUrlEmbedded() {
    return window.location.protocol + '//' + window.location.host + '/rpc/api';
  }

  getCookieOptions(minutes) {
    let now = new Date();
    let expTime = new Date(now);
    expTime.setMinutes(now.getMinutes() + minutes);

    let retOp = {path: '/', expires: expTime, secure: true, sameSite: true};
    //allow http for development
    if(getAppConfig('dev')) {
      retOp.secure = false;
    }
    return retOp;
  }

  setSmCredentials(credsData) {
    this.connections.sm = credsData.sm;
    this.connections.sm.apiUrl =
      this.getSmUrl(this.connections.sm.creds.host, this.connections.sm.creds.port);
    //save the sessionKey to COOKIES
    COOKIES.set(
      'suseManagerSessionKey', this.connections.sm.sessionKey, this.getCookieOptions(60)
    );
    this.smSessionKey = this.connections.sm.sessionKey;

    let conn = JSON.parse(JSON.stringify(this.connections.sm));
    delete conn.creds.password;
    return conn;
  }

  setOvCredentials(credsData) {
    this.connections.ov = credsData.ov;
    this.connections.ov.apiUrl =
      'https://' + this.connections.ov.creds.host;
    //save the sessionKey to COOKIES
    COOKIES.set(
      'oneViewSessionKey', this.connections.ov.sessionKey, this.getCookieOptions(60)
    );
    this.ovSessionKey = this.connections.ov.sessionKey;

    let conn = JSON.parse(JSON.stringify(this.connections.ov));
    delete conn.creds.password;
    return conn;
  }

  handleDoneCredsInput = (credsData) => {
    this.setState({showCredsModal: false,});
    // need to update saved connections
    let saveConnect =
      this.props.connectionInfo ? this.props.connectionInfo : {
        sm: {checked: false, secured: true}, ov: {checked: false, secured: true}};
    if (credsData.sm && credsData.sm.checked) {
      let smConn = this.setSmCredentials(credsData);
      saveConnect.sm = smConn;
    }
    else {
      saveConnect.sm.checked = false;
    }

    if (credsData.ov && credsData.ov.checked) {
      let ovConn = this.setOvCredentials(credsData);
      saveConnect.ov = ovConn;
    }
    else {
      saveConnect.ov.checked = false;
    }

    this.props.updateGlobalState('connectionInfo', saveConnect);

    //if it is very first time...run discovery
    //if it is invoked from configure button, don't run discovery
    //if clicks discovery button and force promt credential inputs...need to run discovery
    if((this.state.rawDiscoveredServers && this.state.rawDiscoveredServers.length === 0) ||
      this.forcePromtCreds) {
      this.handleDiscovery();
    }
  }

  handleShowServerDetails = (rowData, tableId) => {
    this.setState({showServerDetailsModal: true, activeRowData: rowData});
    this.activeTableId = tableId;
  }

  handleCloseServerDetails = () => {
    this.setState({showServerDetailsModal: false, activeRowData: undefined});
    this.activeTableId = undefined;
  }

  handleDoneEditServer = (server) => {
    //update model and save on the spot
    this.updateModelObjectForEditServer(server);

    //update servers and save to the backend
    this.updateServerForEditServer(server);

    this.setState({showEditServerModal: false, activeRowData: undefined});
  }

  handleCancelEditServer = () => {
    this.setState({showEditServerModal: false, activeRowData: undefined});
  }

  handleShowEditServer = (rowData) => {
    this.setState({showEditServerModal: true, activeRowData: rowData});
  }

  handleCloseMessage = (ind) => {
    this.setState((prevState) => {
      //eslint falsely flags messages below as not used
      messages: prevState.messages.splice(ind, 1); // eslint-disable-line no-unused-labels
    });
  }

  // get model object and saved servers before render UI
  componentWillMount() {
    try {
      //global suse manager token when embedded
      this.smApiToken = apiToken; // eslint-disable-line no-undef
    } catch (ReferenceError) {
      //pass
    }

    this.getSavedDiscoveredServers()
      .then((rawServerData) => {
        if(rawServerData) {
          this.setState({rawDiscoveredServers : rawServerData});
        }
        getServerRoles(this.props.model);
      })
      .catch((error) => {
        let msg = translate('server.discover.get.error');
        this.setState(prev => { return {
          messages: prev.messages.concat([{msg: [msg, error.toString()]}])
        };});
        //still get model
        getServerRoles(this.props.model);
      });

    // get manually added servers
    fetch(getAppConfig('shimurl') + '/api/v1/server?source=manual')
      .then(response => response.json())
      .then((responseData) => {
        if (responseData.length > 0) {
          this.setState({serversAddedManually: responseData});
        }
      });
  }

  getSavedDiscoveredServers() {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/server?source=sm,ov')
        .then((response) => this.checkResponse(response))
        .then(response => response.json())
    );
  }

  saveDiscoveredServers(resultServers) {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/server', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resultServers)
      })
        .then((response) => this.checkResponse(response))
    );
  }

  updateDiscoveredServer(server) {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/server', {
        method: 'PUT',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(server)
      })
        .then((response) => this.checkResponse(response))
    );
  }

  deleteDiscoveredServers() {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/server?source=sm,ov', {
        method: 'DELETE'
      })
        .then((response) => this.checkResponse(response))
    );
  }

  updateSmServerDataWithDetails = (details, servers) => {
    let retData = [];
    //details could contain empty data
    details.forEach((srvDetail) => {
      // promise could return empty detail
      // only pick up non empty detail.
      if(srvDetail && srvDetail.id) {
        let nkdevice = srvDetail.network_devices.find((device) => {
          return device.interface === 'eth0';
        });
        //at this point only these are useful
        let id = srvDetail.name ? srvDetail.name : srvDetail.id + '';
        let serverData = {
          'id': id, //use name if it is there or use id string
          'name': srvDetail.name,
          'serverId': srvDetail.id,
          'ip-addr': nkdevice.ip,
          'mac-addr': nkdevice.hardware_address,
          'cpu': srvDetail.cpu_info.count,
          'ram': srvDetail.ram,
          'ilo-ip': '',
          'ilo-user': '',
          'ilo-password': '',
          'nic-mapping': '',
          'server-group': '',
          'source': 'sm',
          'details': srvDetail //save the details for showing details later
        };
        retData.push(serverData);
      }
    });

    // for some reason don't have all the details
    // fall back to fill out the data from servers
    if(retData.length < servers.length) {
      let list = [];
      if(retData.length === 0) {
        list = servers;
      }
      else { //some have details, some don't
        let ids = retData.map((srv) => {
          return srv.serverId;
        });
        list = servers.filter((srv) => {
          return ids.indexOf(srv.id) === -1;
        });
      }

      let retData2 = list.map((server) => {
        let id = server.name ? server.name : server.id + '';
        let serverData = {
          'id': id, //use name if it is there or use id string
          'name': server.name,
          'serverId': server.id,
          'ip-addr': '',
          'mac-addr': '',
          'cpu': '',
          'ram': '',
          'ilo-ip': '',
          'ilo-user': '',
          'ilo-password': '',
          'nic-mapping': '',
          'server-group': '',
          'source': 'sm'
        };
        return serverData;
      });

      retData = retData.concat(retData2);
    }

    return retData;
  }

  updateOvServerData = (servers) => {
    let retData = servers.map((srv) => {
      let id = srv.name ? srv.name : srv.uuid + '';
      let ipmi = undefined;
      if(srv.mpHostInfo) {
        ipmi = srv.mpHostInfo.mpIpAddresses.find((addr) => {
          return addr.type === 'DHCP' || addr.type === 'Static';
        });
      }
      //TODO get mac addresse if portMap available

      let serverData = {
        'id': id, //use name if it is there or use id string
        'name': srv.name,
        'serverId': srv.uuid || '',
        'ip-addr': '',
        'mac-addr': '',
        'cpu': srv.processorCoreCount,
        'ram': srv.memoryMb,
        'ilo-ip': ipmi ? ipmi.address : '',
        'ilo-user': '',
        'ilo-password': '',
        'nic-mapping': '',
        'server-group': '',
        'source': 'ov',
        'details': srv //save all the information for showing detail later
      };
      return serverData;
    });
    return retData;
  }


  // Merges the relevant properties of destination server into the src and returns the merged version.  Neither
  // src or dest are modified
  getMergedServer = (src, dest) => {
    let result = Object.assign({}, src);
    const props = ['name', 'ip-addr', 'mac-addr' ,'server-group' ,'nic-mapping' ,'ilo-ip' ,'ilo-user' ,'ilo-password'];

    props.forEach(p => {
      if (p in dest)
        result[p] = dest[p];
    });

    return result;
  }

  // Create a sanitized version of the a server entry, with empty strings instead of undefined values
  getCleanedServer(srv) {
    const strId = srv['id'].toString();
    return {
      'id': strId,
      'name': srv.name || strId,
      'ip-addr': srv['ip-addr'],
      'mac-addr': srv['mac-addr'] || '',
      'role': srv['role'] || '',
      'server-group': srv['server-group'] || '',
      'ilo-ip': srv['ilo-ip'] || '',
      'ilo-user': srv['ilo-user'] || '',
      'ilo-password': srv['ilo-password'] || '',
      'nic-mapping': srv['nic-mapping'] || ''
    };
  }

  //prototype query suse manager for details
  getSmOneServerDetailData = (shimUrl, smTokenKey, smUrl) => {
    let promise = new Promise((resolve, reject) => {
      fetch(shimUrl, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Auth-Token': smTokenKey,
          'Suse-Manager-Url': smUrl
        }
      })
        .then(response => response.json())
        .then((responseData) => {
          resolve(responseData);
        })
        .catch(error => {
          resolve({}); //just have no details
        });
    });
    return promise;
  }

  getSmAllServerDetailsData = (serverIds, smTokenKey, smUrl) => {
    let tasks = [];
    serverIds.forEach((id) => {
      let shimUrl = getAppConfig('shimurl') + '/api/v1/sm/servers/' + id;
      tasks.push(this.getSmOneServerDetailData(shimUrl, smTokenKey, smUrl));
    });

    return Promise.all(tasks);
  }

  /**
   * assign a server to a particular role in the datamodel, then update the model and save it
   *
   * @param {Object} server - data object representing the server and its known metadata
   * @param {string} role - the role that the server is to be assigned to as it matches the model
   *   (not the user-friendly translation)
   */
  assignServerToRole = (server, role) => {

    let model = this.props.model;

    const index = model.getIn(['inputModel', 'servers']).findIndex(e => e.get('id') === server.id);
    if (index < 0) {
      // The server was not in the model, so add it with the new role
      let new_server = this.getCleanedServer(server);
      new_server['role'] = role;

      // Append the server to the input model
      model = model.updateIn(['inputModel', 'servers'], list => list.push(fromJS(new_server)));
    } else {

      // Update the role in the existing input model entry
      model = model.updateIn(['inputModel', 'servers'], list => list.map(svr => {
        if (svr.get('id') === server.id)
          return svr.set('role', role);
        else
          return svr;
      }));
    }
    this.props.updateGlobalState('model', model);
  }

  /**
   * trigger server assignment to a role via drag and drop. parses the payload of a ServerRowItem drag event
   * and adds the represented server to the role specified
   *
   * @param {event} event - the browser event for the drop action, should contain a data
   *   JSON object per ServerRowItem.js
   * @param {string} role - the role to assign the server to
   */
  assignServerToRoleDnD = (event, role) => {
    let serverData = JSON.parse(event.dataTransfer.getData('data'));

    this.assignServerToRole(serverData, role);
    this.unHighlightDrop(event, true);
  }

  /**
   * removes a server from a specified model role, parses the payload of a ServerRowItem drag event for data
   * and them removes the represented server to the role specified
   *
   * @param {event} event - the browser event for the drop action, should contain a data
   *   JSON object per ServerRowItem.js
   */
  removeServerFromRoleDnD = (event) => {
    let serverData = JSON.parse(event.dataTransfer.getData('data'));
    this.removeServerFromRole(serverData, serverData.role);

    this.unHighlightDrop(event, true);
  }

  /**
   * remove a server from a particular role in the datamodel, then update the model and save it
   *
   * @param {Object} server - data object representing the server and its known metadata
   * @param {String} role - the role that the server is to be assigned to as it matches the model
   *   (not the user-friendly translation)
   */
  removeServerFromRole = (server, role) => {

    // Remove the server from the model
    const model = this.props.model.updateIn(
      ['inputModel', 'servers'], list => list.filter(svr => svr.get('id') != server.id));
    this.props.updateGlobalState('model', model);
  }

  /**
   * standard drop handler, does not do any validation for now, but that could be added later
   *
   * @param {event} event - the browser event from dragging over a dropzone
   * @param {string} role - the server role represented by this dropzone
   */
  allowDrop = (event, role) => {
    event.preventDefault();
  }

  /**
   * adds an outline highlighting the dropzone for drag and drop server assignment
   * stores the previous settings on the element to be restored later
   *
   * @param {event} event - the browser event from dragEnter
   */
  highlightDrop = (event) => {
    let element = $(event.target); // eslint-disable-line no-undef
    if(!element.hasClass('server-dropzone')) {
      element = element.closest('.server-dropzone');
    }
    element.css('prevoutline', element.css('outline'));
    element.css('prevmargin', element.css('margin'));
    element.css('outline', '2px #00C081 dashed');
    element.css('margin', '2px');
  }

  /**
   * removes the outline around the current dropzone, checks the leave event position before deciding to remove
   * the highlight to make sure its taking the outline off of the correct element. Can be forced to skip
   * the position check with optional forceclear parameter
   *
   * @param {event} event - the browser event from dragLeave
   * @param {boolean} forceclear (optional) - whether to forcibly remove the highlighting
   */
  unHighlightDrop = (event, forceclear) => {
    let element = $(event.target); // eslint-disable-line no-undef
    if(!element.hasClass('server-dropzone')) {
      element = element.closest('.server-dropzone');
    }
    if(forceclear ||
       element.offset().left > event.pageX ||
       element.offset().left + element.width() < event.pageX ||
       element.offset().top >= event.pageY ||
       element.offset().top + element.height() <= event.pageY) {
      element.css('outline', element.css('prevoutline') || '');
      element.css('margin', element.css('prevmargin') || '');
    }
  }

  /**
   * When a server is edited (which is only possible in from the assigned servers page
   * on the right), update the details of the matching entry in the list that backs
   * the available servers (on the left).  This ensures that the correct information
   * is persisted to the discovered server store, and also ensures that no information
   * is dropped when unassigning and reassigning servers to roles.
   */
  updateServerForEditServer = (server) => {
    for (let list of ['rawDiscoveredServers', 'serversAddedManually']) {
      let idx = this.state[list].findIndex(s => server.id === s.id);
      if (idx >= 0) {
        let updated_server;
        this.setState(prev => {
          let tempList = prev[list].slice();
          updated_server = this.getMergedServer(tempList[idx], server);
          tempList.splice(idx, 1, updated_server);
          return {[list]: tempList};
        }, () => {
          this.updateDiscoveredServer(updated_server)
            .then((response) => {})
            .catch((error) => {
              let msg = translate('server.discover.update.error', updated_server.name);
              this.setState(prev => { return {
                messages: prev.messages.concat([{msg: [msg, error.toString()]}])
              };});
            });
        });
        break;
      }
    }
  }

  updateModelObjectForEditServer = (server) => {
    //update model
    let model = this.props.model;

    let index = model.getIn(['inputModel', 'servers']).findIndex(e => e.get('id') === server.id);
    if (index >= 0) {
      const update_svr = {
        //fields from edit server
        'ip-addr': server['ip-addr'],
        'mac-addr': server['mac-addr'],
        'server-group': server['server-group'],
        'nic-mapping': server['nic-mapping'],
        'ilo-ip': server['ilo-ip'],
        'ilo-user': server['ilo-user'],
        'ilo-password': server['ilo-password']
      };
      model = model.mergeIn(['inputModel', 'servers', index], update_svr);
    } else {
      model = model.updateIn(['inputModel', 'servers'], list => list.push(fromJS(server)));
    }

    this.props.updateGlobalState('model', model);
  }


  //check if we have enough servers roles for the model
  isValid = () => {
    return getServerRoles(this.props.model).every(role => {
      return isRoleAssignmentValid(role);
    });
  }

  getSourceData = (activeRowData, activeTableId) => {
    if(!activeRowData || !activeTableId) {
      return;
    }
    let sourceData = undefined;
    if(activeTableId.startsWith('letfTableId')) {
      return activeRowData; //left side table always has source
    }
    else {
      let id = activeRowData.id; //should be a name or id
      //go to the leftside list for find data
      sourceData = this.state.rawDiscoveredServers.find((server) => {
        return id === server.id;
      });
      if(!sourceData) {
        sourceData = this.state.serversAddedManually.find((server) => {
          return id === server.id;
        });
      }
    }
    return sourceData;
  }

  setNextButtonDisabled = () => !this.isValid();

  renderErrorMessage() {
    if (!isEmpty(this.state.messages)) {
      let msgList = [];
      this.state.messages.map((msgObj, ind) => {
        let theProps = {message: msgObj.msg};
        if(msgObj.title) {
          theProps.title = msgObj.title;
        }
        msgList.push(
          <ErrorMessage key={ind} closeAction={() => this.handleCloseMessage(ind)}
            {...theProps}/>);
      });
      return (
        <div className='notification-message-container'>{msgList}</div>
      );
    }
  }

  renderLoadingMask() {
    return (
      <LoadingMask show={this.state.loading}></LoadingMask>
    );
  }

  renderAvailServersTable(servers,  type) {
    //displayed columns
    let tableConfig = {
      columns: [
        {name: 'id', hidden: true},
        {name: 'name'},
        {name: 'ip-addr',},
        {name: 'mac-addr'},
        {name: 'cpu', hidden: true},
        {name: 'ram', hidden: true},
        {name: 'server-group', hidden: true},
        {name: 'nic-mapping', hidden: true},
        {name: 'ilo-ip', hidden: true},
        {name: 'ilo-user', hidden: true},
        {name: 'ilo-password', hidden: true},
        {name: 'source', hidden: true}
      ]
    };

    const assignedServerIds = this.props.model.getIn(['inputModel','servers'])
      .filter(svr => (svr.get('role') ? true : false))    // find servers with roles
      .map(svr => svr.get('id')).toJS();                  // return just the id field

    //apply name and assignment filter here
    let filteredAvailableServers =
      servers.filter((server) => {
        if(server.name.indexOf(this.state.searchFilterText) === -1) {
          return false;
        }

        //server name is acceptable per text filter, now need to filter out assigned servers
        return (assignedServerIds.indexOf(server.id) === -1);
      });

    let tableId = 'leftTableId' + type;
    return (
      <ServerTable
        id={tableId}
        tableConfig={tableConfig}
        tableData={filteredAvailableServers}
        viewAction={this.handleShowServerDetails}>
      </ServerTable>
    );
  }

  renderAutoDiscoverContent() {
    //only render when don't have any raw discovered data or not suse manager embedded
    if(this.state.rawDiscoveredServers.length === 0) {
      return (
        <div className='centered'>
          <ActionButton
            clickAction={this.handleConfDiscovery}
            displayLabel={translate('add.server.discover')}/>
        </div>
      );
    }
    else {
      return (
        <div>
          {this.renderAvailServersTable(this.state.rawDiscoveredServers, '_auto')}
        </div>
      );
    }
  }

  renderManualDiscoverContent = () => {
    if (this.state.serversAddedManually.length > 0) {
      return (
        <div className='full-width'>
          {this.renderAvailServersTable(this.state.serversAddedManually, '_manual')}
        </div>
      );
    } else {
      // When there are no servers yet discovered, the tab shows just
      // two buttons instead of content
      return (
        <div className='btn-row centered'>
          <ActionButton
            clickAction={this.handleAddServerManually}
            displayLabel={translate('add.server.add')}/>
          <LoadFileButton
            clickAction={this.handleAddServerFromCSV}
            displayLabel={translate('add.server.add.csv')}/>
        </div>
      );
    }
  }

  renderAvailableServersTabs() {
    return (
      <Tabs
        activeKey={this.state.selectedServerTabKey}
        onSelect={this.handleSelectServerTab} id='AvailableServerTabsId'>
        <Tab
          eventKey={AUTODISCOVER_TAB} title={translate('add.server.auto.discover')}>
          {this.state.selectedServerTabKey === AUTODISCOVER_TAB && this.renderAutoDiscoverContent()}
        </Tab>
        <Tab
          eventKey={MANUALADD_TAB} title={translate('add.server.manual.add')}>
          {this.state.selectedServerTabKey === MANUALADD_TAB && this.renderManualDiscoverContent()}
        </Tab>
      </Tabs>
    );
  }

  renderConfigDiscoveryButton() {
    return  (
      <ActionButton type='default'
        clickAction={this.handleConfDiscovery}
        displayLabel={translate('add.server.conf.discover')}/>
    );
  }

  renderSearchBar() {
    if (this.state.selectedServerTabKey === MANUALADD_TAB &&
      this.state.serversAddedManually.length > 0) {
      return (
        <div className='action-line table-header-wrapper'>
          <div className='action-item-left'>
            <SearchBar
              filterText={this.state.searchFilterText}
              filterAction={this.handleSearchText}>
            </SearchBar>
          </div>
          <div>
            <div className='btn-row action-item-right'>
              <ActionButton
                clickAction={this.handleAddServerManually}
                displayLabel={translate('add.server.add')}/>
              <LoadFileButton
                clickAction={this.handleAddServerFromCSV}
                displayLabel={translate('add.server.add.csv')}/>
            </div>
          </div>
        </div>
      );
    } else if (this.state.selectedServerTabKey === AUTODISCOVER_TAB &&
      this.state.rawDiscoveredServers.length > 0) {
      return (
        <div className='action-line table-header-wrapper'>
          <div className='action-item-left'>
            <SearchBar
              filterText={this.state.searchFilterText}
              filterAction={this.handleSearchText}>
            </SearchBar>
          </div>
          <div>
            <div className='btn-row action-item-right'>
              {!this.smApiToken && this.renderConfigDiscoveryButton()}
              <ActionButton
                clickAction={this.handleDiscovery}
                displayLabel={translate('add.server.discover')}/>
            </div>
          </div>
        </div>
      );
    }
    else {
      return (
        <div className='table-header-wrapper'>
          <SearchBar
            filterText={this.state.searchFilterText}
            filterAction={this.handleSearchText}>
          </SearchBar>
        </div>
      );
    }
  }

  renderServerRolesAccordion(roles) {
    return (
      <ServerRolesAccordion
        ondropFunct={this.assignServerToRoleDnD}
        ondragEnterFunct={this.highlightDrop}
        ondragLeaveFunct={this.unHighlightDrop}
        allowDropFunct={this.allowDrop}
        serverRoles={getServerRoles(this.props.model)}
        tableId='rightTableId'
        editAction={this.handleShowEditServer}
        viewAction={this.handleShowServerDetails}>
      </ServerRolesAccordion>
    );
  }

  renderServerRoleContent() {
    return (
      <div className='assign-server-role body-container'>
        <div className='server-container'>
          {this.renderSearchBar()}
          <div className="server-table-container rounded-corner server-dropzone"
            onDrop={(event) => this.removeServerFromRoleDnD(event)}
            onDragOver={(event) => this.allowDrop(event, undefined)}
            onDragEnter={(event) => this.highlightDrop(event)}
            onDragLeave={(event) => this.unHighlightDrop(event)}>
            {this.renderAvailableServersTabs()}
          </div>
        </div>
        <div className="server-container right-col">
          <div className="server-table-container role-accordion-container rounded-corner">
            {this.renderServerRolesAccordion()}
          </div>
        </div>
      </div>
    );
  }

  renderCredsInputModal() {
    return (
      <BaseInputModal
        show={this.state.showCredsModal}
        className='creds-dialog'
        onHide={this.handleCancelCredsInput}
        title={translate('add.server.connection.creds')}>

        <ConnectionCredsInfo
          cancelAction={this.handleCancelCredsInput} doneAction={this.handleDoneCredsInput}
          data={this.connections}>
        </ConnectionCredsInfo>
      </BaseInputModal>
    );
  }

  renderServerDetailsModal() {
    //if the activeRowData is from the right side table...it doesn't have the
    //source ...need to find source data which has the details
    let sourceData =
      this.getSourceData(this.state.activeRowData, this.activeTableId);

    let theProps = {};
    let dialogClass = 'view-details-dialog ';
    if(sourceData && (sourceData.source === 'sm' || sourceData.source === 'ov')) {
      theProps.tableId = this.activeTableId;
      theProps.source = sourceData.source;
      theProps.details = sourceData.details;
      dialogClass = dialogClass + 'more-width';
    }
    return (
      <BaseInputModal
        show={this.state.showServerDetailsModal}
        className={dialogClass}
        onHide={this.handleCloseServerDetails}
        title={translate('view.server.details.heading')}>

        <ViewServerDetails
          cancelAction={this.handleCloseServerDetails}
          data={this.state.activeRowData} {...theProps}>
        </ViewServerDetails>
      </BaseInputModal>
    );
  }

  renderEditServerDetailsModal() {
    return (
      <BaseInputModal
        show={this.state.showEditServerModal}
        className='edit-details-dialog'
        onHide={this.handleCancelEditServer}
        title={translate('edit.server.details.heading')}>

        <EditServerDetails
          cancelAction={this.handleCancelEditServer}
          doneAction={this.handleDoneEditServer}
          serverGroups={getServerGroups(this.props.model)} nicMappings={getNicMappings(this.props.model)}
          data={this.state.activeRowData}>
        </EditServerDetails>
      </BaseInputModal>
    );
  }

  render() {
    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('add.server.heading', this.props.model.get('name')))}
        </div>
        <div id='AssignServerRoleId' className='wizard-content'>
          {this.renderServerRoleContent()}
          {this.renderCredsInputModal()}
          {this.renderAddServerManuallyModal()}
          {this.renderServerDetailsModal()}
          {this.renderEditServerDetailsModal()}
          {this.renderLoadingMask()}
          {this.renderErrorMessage()}
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default AssignServerRoles;
