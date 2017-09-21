import React from 'react';
import '../Deployer.css';
import Cookies from 'universal-cookie';
import { Tabs, Tab } from 'react-bootstrap';
import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import { ActionButton } from '../components/Buttons.js';
import { IpV4AddressValidator, MacAddressValidator } from '../utils/InputValidators.js';
import { SearchBar, ServerRolesAccordion, ServerInput, ServerDropdown }
  from '../components/ServerUtils.js';
import { BaseInputModal, ConfirmModal } from '../components/Modals.js';
import BaseWizardPage from './BaseWizardPage.js';
import ConnectionCredsInfo from '../components/ConnectionCredsInfo';
import { ErrorMessage } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';
import ServerTable from '../components/ServerTable.js'
import EditServerDetails from '../components/EditServerDetails.js'

const AUTODISCOVER_TAB = 1;
const MANUALADD_TAB = 2;
const COOKIES = new Cookies();

class AssignServerRoles extends BaseWizardPage {

  constructor(props) {
    super(props);

    //variables
    this.model = undefined;
    this.serverGroups = undefined;
    this.nicMappings = undefined;
    this.selectedModelName = this.props.selectedModelName;
    this.checkInputKeys = [
      'nic-mapping',
      'server-group'
    ];
    this.activeRowData = undefined;
    this.errorContent = undefined;
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

    this.credentials = window.discoverCreds ? window.discoverCreds : {
      sm: {creds: {}},
      ov: {creds: {}}
    };
    this.selectedServerRole = '';
    this.smApiUrl = '';
    this.smApiToken = undefined;
    this.smSessionKey = undefined;

    //states changes will rerender UI
    this.state = {
      //the list of server roles from the cloud model
      serverRoles: [],
      //server list on the available servers side
      //could be filtered
      displayAvailableServers: [],
      //server list on the assigned servers side
      //also changed when select role
      displayAssignedServers: [],
      //when move servers the filter text could be cleared
      searchFilterText: '',
      //turn on/off next
      pageValid: false,
      //what tab key selected
      selectedServerTabKey: AUTODISCOVER_TAB,
      //show or not credentials modal
      showCredsModal: false,

      // Add Server Manually modal
      showAddServerManuallyModal: false,
      validAddServerManuallyForm: false,
      serversAddedManually: [],

      // show Add Server From CSV modal
      showAddFromCSVModal: false,

      //when loading data or saving data
      loading: false,
      //show error message
      showError: false,
      //show server details modal
      showServerDetailsModal: false,
      //show edit server details modal
      showEditServerDetailsModal: false,

      rawDiscoveredServers: [],
      accordionDisplayPosition: 0
    };

    this.handleAddServerFromCSV = this.handleAddServerFromCSV.bind(this);
  }

  refreshServers(rawServerData) {
    let serverRoles = this.state.serverRoles;
    serverRoles.forEach((role) => {
      //clean up servers
      role.servers = [];
    });

    this.setState({
      displayAssignedServers: [],
      displayAvailableServers: [],
      searchFilterText: '',
      serverRoles: serverRoles
    });

    if(this.model) {
      //this will parse model and
      //consolidate availableServers and assignedServers
      this.getServerRoles(this.model, rawServerData);
      this.validateServerRoleAssignment();
    }
    else {
      //don't have model for some reason
      let msg = translate('server.model.empty.error');
      this.setErrorMessageContent(msg);
      this.setState({showError: true});
    }
  }

  getSmServersData(tokenKey, smUrl) {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/sm/servers', {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Authtoken': tokenKey,
          'Susemanagerurl': smUrl
        }
      })
        .then((response) => this.checkResponse(response))
        .then(response => response.json())
    );
  }

  doSmDiscovery(tokenKey, smUrl) {
    let promise = new Promise((resolve, reject) => {
      this.getSmServersData(tokenKey, smUrl)
      .then((rawServerData) => {
        if (rawServerData && rawServerData.length > 0) {
          let ids = rawServerData.map((srv) => {
            return srv.id;
          });

          this.getSmAllServerDetailsData(ids, tokenKey, smUrl)
            .then((details) => {
              rawServerData = this.updateSmServerDataWithDetails(details);
              resolve(rawServerData);
            })
            .catch((error) => {
              //don't reject ...just move on
            });
        }
      })
      .catch((error) => {
        let msg = translate('server.discover.sm.error');
        this.setErrorMessageContent(msg, error.toString());
        reject(error);
      });
    });
    return promise;
  }

  //run discovery for suse manager and/or hpe oneview parallelly
  //meanwhile also go update the table data with more details by query
  //detail one by one in parallel.
  doAllDiscovery = () => {
    let promises = [];
    if(this.smSessionKey) {
      promises.push(this.doSmDiscovery(this.smSessionKey, this.smApiUrl));
    }
    else if(this.smApiToken) {
      let url = window.location.protocol + '//' + window.location.host +
        (window.location.port > 0 ? ':' + window.location.port : '')  + '/rpc/api';
      promises.push(this.doSmDiscovery(this.smApiToken, url));
    }

    //TODO add hpe oneview discovery in promise array
    // if(this.state.ovSessionKey) {
    //
    // }

    return Promise.all(promises);
  }

  checkResponse(response) {
    if (!response.ok) {
      throw Error(response.url + ': ' + response.statusText);
    }
    return response;
  }

  setErrorMessageContent(msg, errorStr) {
    let msgContent = {
      messages: errorStr ? [msg, errorStr] : msg
    };

    if (this.errorContent !== undefined) {
      msgContent.messages = msgContent.messages.concat(this.errorContent.messages);
    }
    this.errorContent = msgContent;
  }

  doSaveAllDiscoveredServers(servers) {
    this.deleteDiscoveredServers()
      .then((response) => {
      this.saveDiscoveredServers(servers)
        .then((response) => {})
        .catch((error) => {
          let msg = translate('server.discover.save.error');
          this.setErrorMessageContent(msg, error.toString());
          this.setState({showError: true});
        });
      })
      .catch((error) => {
        let msg = translate('server.discover.get.error');
        this.setErrorMessageContent(msg, error.toString());
        this.setState({showError: true});
      });
  }

  handleDiscovery = () => {
    if(!this.smApiToken && !this.smSessionKey) {
      //don't have any session keys...need inputs
      this.setState({showCredsModal: true});
    }//TODO include ov sessionkey check
    else {
      this.setState({loading: true});
      let resultServers = [];
      this.doAllDiscovery()
        .then((allServerData) => {
          allServerData.forEach((oneSet, idx) => {
            resultServers = resultServers.concat(oneSet);
          });
          this.doSaveAllDiscoveredServers(resultServers);
          this.setState({loading: false, rawDiscoveredServers: resultServers});
          this.refreshServers(resultServers);
        })
        .catch((error) => {
          this.setState({loading: false, showError: true});
        })
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
    let inputTitle = (required) ? translate(title) + '*' : translate(title);
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{inputTitle}</div>
        <div className='input-body'>
          <ServerInput isRequired={required} inputName={name} inputType={type} inputValidate={validator}
            inputAction={this.handleInputLine} inputValue={this.newServer[name]}/>
        </div>
      </div>
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
        this.setState({validAddServerManuallyForm: true})
      }
    } else {
      this.setState({validAddServerManuallyForm: false});
    }
  }

  renderDropdownLine(required, title, name, list, handler) {
    let inputTitle = (required) ? translate(title) + '*' : translate(title);
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{inputTitle}</div>
        <div className='input-body'>
          <ServerDropdown name={name} value={this.newServer[name]} optionList={list}
            selectAction={handler}/>
        </div>
      </div>
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

  saveServerAddedManually = () => {
    // save this.newServer before it gets wiped later, to prevent race condition
    let server = Object.assign({}, this.newServer);

    // if role is not None, add server to this.model and this.state.serverRoles
    // so that it will get displayed in the accordion table and saved to the input model
    if (server.role !== translate('server.none.prompt').toString()) {
      this.model.inputModel.servers.push(server);
      let serverRoles = this.state.serverRoles;
      serverRoles.forEach((roleObj) => {
        if (roleObj.serverRole === server.role) {
          roleObj.servers.push(server);
        }
      });
      this.setState((prevState) => {
        serverRoles: serverRoles
      });
      this.saveModelObjectData()
        .then((response) => {})
        .catch((error) => {
          let msg = translate('server.model.save.error');
          this.setErrorMessageContent(msg, error.toString());
          this.setState({showError: true});
        });
    }

    // add server to the left table and the server API
    this.setState((prevState) => {
      return {serversAddedManually: prevState.serversAddedManually.concat([server])};
    });
    fetch(getAppConfig('shimurl') + '/api/v1/server', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([server])
      })
    this.resetAddServerManuallyModal();
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
    this.saveServerAddedManually();
    this.closeAddServerManuallyModal();
  }

  addMoreServer = () => {
    this.saveServerAddedManually();
  }

  getSmUrl(host, port) {
    let url = 'https://' + host + ':' + (port <= 0 ? '8443' : port) + '/rpc/api';
    return url;
  }

  renderAddServerManuallyModal = () => {
    let body = '';
    if (this.state.serverRoles && this.serverGroups && this.nicMappings) {
      let roles = this.state.serverRoles.map((server) => {return server.serverRole});
      roles.unshift(translate('server.none.prompt').toString());
      if (!this.newServer.role) {
        this.newServer.role = roles[0];
      }
      if (!this.newServer['server-group']) {
        this.newServer['server-group'] = this.serverGroups[0];
      }
      if (!this.newServer['nic-mapping']) {
        this.newServer['nic-mapping'] = this.nicMappings[0];
      }
      body = (
        <div>
          <div className='server-details-container'>
            {this.renderInputLine(true, 'server.name.prompt', 'name', 'text')}
            {this.renderInputLine(true, 'server.ip.prompt', 'ip-addr', 'text', IpV4AddressValidator)}
            {this.renderDropdownLine(true, 'server.group.prompt', 'server-group',
              this.serverGroups, this.handleSelectGroup)}
            {this.renderDropdownLine(true, 'server.nicmapping.prompt', 'nic-mapping',
              this.nicMappings, this.handleSelectNicMapping)}
            {this.renderDropdownLine(false, 'server.role.prompt', 'role', roles,
              this.handleSelectRole)}
          </div>
          <div className='message-line'>{translate('server.ipmi.message')}</div>
          <div className='server-details-container'>
            {this.renderInputLine(false, 'server.mac.prompt', 'mac-addr', 'text', MacAddressValidator)}
            {this.renderInputLine(false, 'server.ipmi.ip.prompt', 'ilo-ip', 'text', IpV4AddressValidator)}
            {this.renderInputLine(false, 'server.ipmi.username.prompt', 'ilo-user', 'text')}
            {this.renderInputLine(false, 'server.ipmi.password.prompt', 'ilo-password', 'text')}
          </div>
        </div>
      );
    }
    let footer = (
      <div className='btn-row'>
        <ActionButton clickAction={this.cancelAddServerManuallyModal}
          displayLabel={translate('cancel')}/>
        <ActionButton clickAction={this.addOneServer} displayLabel={translate('save')}
          isDisabled={!this.state.validAddServerManuallyForm}/>
        <ActionButton clickAction={this.addMoreServer} displayLabel={translate('add.more')}
          isDisabled={!this.state.validAddServerManuallyForm}/>
      </div>
    );
    return (
      <ConfirmModal show={this.state.showAddServerManuallyModal} title={translate('add.server.add')}
        className={'manual-discover-modal'} body={body} footer={footer}/>
    );
  }

  sortServersById(servers) {
    return servers.sort((a, b) => {
      let x = a.name;
      let y = b.name;
      return ((x < y) ? -1 : (x > y) ? 1 : 0);
    });
  }

  handleAddServerFromCSV() {
    //TODO
  }

  handleConfDiscovery = () => {
    if(!this.smApiToken) {
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

  handleDoneCredsInput = (credsData) => {
    this.setState({
      showCredsModal: false,
    });
    if (credsData.sm) {
      this.credentials.sm = credsData.sm;
      //save the sessionKey to COOKIES
      var expDate = new Date();
      expDate.setDate(expDate.getDate() + 1);
      COOKIES.set(
        'suseManagerSessionKey', this.credentials.sm.sessionKey,
        {path: '/', expires: expDate});
      COOKIES.set('suseManagerHost', this.credentials.sm.creds.host, {path: '/', expires: expDate});
      let port = this.credentials.sm.creds.port > 0 ? this.credentials.sm.creds.port : '8443';
      COOKIES.set('suseManagerPort', port, {path: '/', expires: expDate});
      this.smApiUrl = this.getSmUrl(this.credentials.sm.creds.host, this.credentials.sm.creds.port);
      this.smSessionKey = this.credentials.sm.sessionKey;
    }
    if (credsData.ov) {
      this.credentials.ov = credsData.ov;
      //TODO save sessionKey for ov
    }

    //save the creds to the session for now
    window.discoverCreds = this.credentials;

    //this should only happened at the very beginning
    //after that user will use configure and discover buttons
    if (this.state.rawDiscoveredServers.length === 0) {
      this.setState({loading: true});
      let resultServers = [];
      this.doAllDiscovery()
        .then((allServerData) => {
          allServerData.forEach((oneSet, idx) => {
            resultServers = resultServers.concat(oneSet);
          });
          //save it to the backend
          this.doSaveAllDiscoveredServers(resultServers);
          this.refreshServers(resultServers);
          this.setState({rawDiscoveredServers: resultServers, loading: false});
        })
        .catch((error) => {
          this.setState({loading: false, showError: true});
        })
      }
  }

  handleCloseMessageAction = () => {
    this.setState({showError: false});
    this.errorContent = undefined;
  }

  handleShowServerDetails = (rowData) => {
    this.setState({showServerDetailsModal: true});
    this.activeRowData = rowData;
    //TODO need to get details based on source and id
    //then pop a modal
  }

  handleDoneEditServerDetailsInput = (editData) => {
    let roles = this.state.serverRoles;
    let findRole = roles.find((role) => {
      return role.serverRole === editData.role;
    });

    if(findRole) {
      let server = findRole.servers.find((srv) => {
        return srv.id === editData.id;
      });
      if(server) {
        server['ip-addr'] = editData['ip-addr'];
        server['mac-addr'] = editData['mac-addr'];
        server['server-group'] = editData['server-group'];
        server['nic-mapping'] = editData['nic-mapping'];
        server['ilo-ip'] = editData['ilo-ip'];
        server['ilo-user'] = editData['ilo-user'];
        server['ilo-password'] = editData['ilo-password'];
        //update model and save on the spot
        this.updateModelObjectForEditServer(server);
        //update servers and save to the backend
        this.updateServerForEditServer(server);
      }
    }

    this.setState({
      showEditServerDetailsModal: false
    });
    this.activeRowData = undefined;

    this.validateServerRoleAssignment();
  }

  handleCancelEditServerDetailsInput = (editData) => {
    this.setState({
      showEditServerDetailsModal: false
    });
    this.activeRowData = undefined;

    this.validateServerRoleAssignment();
  }

  handleClickRoleAccordion = (idx, role) => {
    this.selectedServerRole = role.serverRole;
    this.setState({
      displayAssignedServers: role.servers,
      accordionDisplayPosition: idx
    })
  }

  handleShowEditServerDetails = (rowData) => {
    this.setState({showEditServerDetailsModal: true});
    this.activeRowData = rowData;
  }

  // get model object and saved servers before render UI
  componentWillMount() {
    try {
      this.smApiToken = apiToken; //global suse manager token when embedded
    } catch (ReferenceError) {
      //it is not embedded so go get cookies
      //when it is expired..get cookie will get undefined
      let sKey = COOKIES.get('suseManagerSessionKey');
      if(sKey) {
        this.smSessionKey = sKey;
      }
      let sHost = COOKIES.get('suseManagerHost');
      let sPort = COOKIES.get('suseManagerPort');
      if(sHost && sPort) {
        this.smApiUrl = this.getSmUrl(sHost, sPort);
        this.credentials.sm.creds.host = sHost;
      }
      //if don't have port, set it to default for the creds input
      this.credentials.sm.creds.port = sPort ? sPort : 8443;
    }

    this.getSavedDiscoveredServers()
      .then((rawServerData) => {
        if(rawServerData) {
          this.setState({rawDiscoveredServers : rawServerData});
        }
        this.doGetModel(rawServerData);
      })
      .catch((error) => {
        let msg = translate('server.discover.get.error');
        this.setErrorMessageContent(msg, error.toString());
        this.setState({showError: true});
        //still get model
        this.doGetModel();
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

  doGetModel(rawServerData) {
    this.getModelObjectData()
      .then((modelData) => {
        this.model = modelData;
        this.getServerGroups(modelData);
        this.getNicMappings(modelData);
        this.getServerRoles(modelData, rawServerData);
        this.validateServerRoleAssignment();
      })
      .catch((error) => {
        let msg = translate('server.model.get.error');
        this.setErrorMessageContent(msg, error.toString());
        this.setState({showError: true});
        //no model, disable next button
        this.setState({pageValid : false});
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

  getServerGroups(modelData) {
    let modelGrps = modelData.inputModel['server-groups'];
    let groups = [];
    if(modelGrps) {
      modelGrps.forEach((grp) => {
        if(grp['server-groups']) {
          groups = groups.concat(grp['server-groups']);
        }
      });
    }
    this.serverGroups = groups;
  }

  getNicMappings(modelData) {
    let modelMps = modelData.inputModel['nic-mappings'];
    let mappings = [];
    if(modelMps) {
      mappings = modelMps.map((map) => {
        return map.name;
      });
    }
    this.nicMappings = mappings;
  }

  updateSmServerDataWithDetails = (details) => {
    //details has everything
    let retData = details.map((srvDetail) => {
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
        'source': 'sm'
      };
      return serverData;
    });
    return retData;
  }

  //process model to get server roles information
  getServerRoles(modelData, rawServerData) {
    //process this.model and get the list of server roles
    //from resources and clusters
    //only pick one control plane for now...
    //could have multiple control planes in the future

    //TODO will deal with multiple control plane later
    let cpData = modelData['inputModel']['control-planes'][0];
    //TODO some error handling
    //this assume a fresh start.
    //need to deal with preserved state
    if(cpData) {
      let resources = cpData.resources;
      let clusters = cpData.clusters;
      let rs_roles = resources.map((res) => {
        let rs_role = {
          'name': res.name,
          'minCount': res['min-count'] || 0,
          'servers': [], //add display server rows
          'serverRole': res['server-role'],
          'group': 'resources'
        };
        return rs_role;
      });
      let cl_roles = clusters.map((res) => {
        let rs_role = {
          'name': res.name,
          'memberCount': res['member-count'] || 0,
          'serverRole': res['server-role'],
          'servers': [], //add display server rows
          'group': 'clusters'
        };

        return rs_role;
      });

      //populate servers in roles from model's servers
      //this is prototype and experimental
      let modelServers = modelData['inputModel'].servers;
      let allRoles = cl_roles.concat(rs_roles);
      let allAssignedSrvIds = [];
      allRoles.forEach((role, idx) => {
        let matchedModelSvrs = modelServers.filter((server) => {
          return server.role === role.serverRole;
        });
        let servers = [];
        if (matchedModelSvrs && matchedModelSvrs.length > 0) {
          servers = matchedModelSvrs.map((srv) => {
            let strId = srv.id + '';  //make it string
            let retValue = {
              'id': strId,
              'name': srv.name ? srv.name : strId,
              'ip-addr': srv['ip-addr'],
              'mac-addr': srv['mac-addr'] || '',
              'role': srv.role || '',
              'server-group': srv['server-group'] || '',
              'ilo-ip': srv['ilo-ip'] || '',
              'ilo-user': srv['ilo-user'] || '',
              'ilo-password': srv['ilo-password'] || '',
              'nic-mapping': srv['nic-mapping'] || ''
            };
            return retValue;
          });

          role.servers = servers;
        }
      });

      this.selectedServerRole = allRoles[this.state.accordionDisplayPosition].serverRole;
      this.setState({
        displayAssignedServers: allRoles[this.state.accordionDisplayPosition].servers,
        displayAvailableServers: rawServerData,
        serverRoles: allRoles
      });
    }
  }

  //prototype query suse manager for details
  getSmOneServerDetailData = (shimUrl, smTokenKey, smUrl) => {
    //TODO passing smTokenKey got from test doesn't seem to work..
    //it has to go with the same rpc client need dig more
    let promise = new Promise((resolve, reject) => {
      fetch(shimUrl, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Authtoken': smTokenKey,
          'Susemanagerurl': smUrl
        }
      })
        .then(response => response.json())
        .then((responseData) => {
          resolve(responseData);
        })
        .catch(error => {
          //pass
        });
    });
    return promise;
  }

  getSmAllServerDetailsData = (serverIds, smTokenKey, smUrl) => {
    let promises = [];
    serverIds.forEach((id) => {
      let shimUrl = getAppConfig('shimurl') + '/api/v1/sm/servers/' + id;
      promises.push(this.getSmOneServerDetailData(shimUrl, smTokenKey, smUrl));
    });

    return Promise.all(promises);
  }

  /**
   * updates the cloud model with the latest role->server mapping and saves it to the backend, triggers sanity
   * check validation for role/server count
   */
  updateAndSaveDataModel() {
    this.updateModelWithServerRoles();
    this.saveModelObjectData();
    this.validateServerRoleAssignment();
  }

  /**
   * assign a server to a particular role in the datamodel, then update the model and save it
   *
   * @param {Object} server - data object representing the server and its known metadata
   * @param {string} role - the role that the server is to be assigned to as it matches the model (not the user-friendly translation)
   */
  assignServerToRole(server, role){
    let serverRoles = this.state.serverRoles;
    serverRoles.forEach((roleObj) => {
      if(roleObj.serverRole === role){
        roleObj.servers.push(server);
        server.role = role;

        this.setState((prevState) => {
          serverRoles: serverRoles
        }, this.updateAndSaveDataModel);
      }
    });
  }

  /**
   * trigger server assignment to a role via drag and drop. parses the payload of a ServerRowItem drag event
   * and adds the represented server to the role specified
   *
   * @param {event} event - the browser event for the drop action, should contain dataDef and data JSON objects per ServerRowItem.js
   * @param {string} role - the role to assign the server to
   */
  assignServerToRoleDnD(event, role){
    let dataDef = JSON.parse(event.dataTransfer.getData("dataDef"));
    let data = JSON.parse(event.dataTransfer.getData("data"));
    let serverData = {};
    dataDef.map(function(key, value){
      serverData[key.name] = data[key.name];
    });
    if(typeof serverData.role !== 'undefined' && serverData.role !== role){
      this.removeServerFromRole(serverData, serverData.role);
    }

    if(typeof serverData.role === 'undefined' || serverData.role !== role) {
      this.assignServerToRole(serverData, role);
    }
  }

  /**
   * removes a server from a specified model role, parses the payload of a ServerRowItem drag event for data
   * and them removes the represented server to the role specified
   *
   * @param {event} event - the browser event for the drop action, should contain dataDef and data JSON objects per ServerRowItem.js
   */
  removeServerFromRoleDnD(event){
    let dataDef = JSON.parse(event.dataTransfer.getData("dataDef"));
    let data = JSON.parse(event.dataTransfer.getData("data"));
    let serverData = {};
    dataDef.map(function(key, value){
      serverData[key.name] = data[key.name];
    });
    if(typeof serverData.role !== 'undefined'){
      this.removeServerFromRole(serverData, serverData.role);
    }
  }

  /**
   * remove a server from a particular role in the datamodel, then update the model and save it
   *
   * @param {Object} server - data object representing the server and its known metadata
   * @param {String} role - the role that the server is to be assigned to as it matches the model (not the user-friendly translation)
   */
  removeServerFromRole(serverData, role){
    let serverRoles = this.state.serverRoles;
    serverRoles.forEach((roleObj) => {
      if(roleObj.serverRole === role){
        //found the matching role , need to remove it now
        var i = 0;
        for(i = roleObj.servers.length - 1; i >= 0; i--){
          if(roleObj.servers[i].id === serverData.id){
            roleObj.servers.splice(i,1);

            this.setState((prevState) => {
              serverRoles: serverRoles
            }, this.updateAndSaveDataModel);
            break;
          }
        };
      }
    });
  }

  /**
   * standard drop handler, does not do any validation for now, but that could be added later
   *
   * @param {event} event - the browser event from dragging over a dropzone
   * @param {string} role - the server role represented by this dropzone
   */
  allowDrop(event, role){
    event.preventDefault();
  }

  //update the model servers based on
  //server role assginment
  updateModelWithServerRoles() {
    let serverRoles = this.state.serverRoles;
    let modelObject = this.model;

    modelObject.inputModel.servers = [];
    serverRoles.forEach((role) => {
      let modelServers = [];
      let servers = role.servers;

      if (servers && servers.length > 0) {
        servers.forEach((svr, idx) => {
          //update model
          modelServers.push({
            'id': svr.id,
            'name': svr.name || '',
            'role': role.serverRole,
            'ip-addr': svr['ip-addr'],
            'mac-addr': svr['mac-addr'],
            'nic-mapping': svr['nic-mapping'] || '',
            'ilo-ip': svr['ilo-ip'] || '',
            'ilo-password': svr['ilo-password'] ||'',
            'ilo-user': svr['ilo-user']|| '',
            'server-group': svr['server-group'] || ''
          });
        });

        modelObject.inputModel.servers =
          modelObject.inputModel.servers.concat(modelServers);
      }
    });
  }

  //query the model object from ardana
  getModelObjectData() {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/clm/model')
        .then((response) => this.checkResponse(response))
        .then(response => response.json())
    );
  }

  updateServerForEditServer = (server) => {
    if(this.state.selectedServerTabKey === AUTODISCOVER_TAB) {
      let discoveredServers = this.state.rawDiscoveredServers;
      let fIdx = discoveredServers.findIndex((dServer) => {
        return server.id === dServer.id && server.source === dServer.source;
      });
      if (fIdx >= 0) {
        discoveredServers[fIdx] = server; //update with more information
        this.updateDiscoveredServer(discoveredServers[fIdx])
        .then((response) => {})
        .catch((error) => {
          let msg = translate('server.discover.update.error', discoveredServers[fIdx].id);
          this.setErrorMessageContent(msg, error.toString());
          this.setState({showError: true});
        });
        this.setState({rawDiscoveredServers: discoveredServers});
      }
    }
    //TODO for manual added servers
  }

  updateModelObjectForEditServer = (server) => {
    //update model
    let modelServers = this.model.inputModel.servers;
    let modelServer = modelServers.find((srv, idx) => {
      //TODO once we settled with db, need to add source in the condition
      return srv.id === server.id;
    });

    if(modelServer) {
      //field from edit server
      modelServer['ip-addr'] = server['ip-addr'];
      modelServer['mac-addr'] = server['mac-addr'];
      modelServer['server-group'] = server['server-group'];
      modelServer['nic-mapping'] = server['nic-mapping'];
      modelServer['ilo-ip'] = server['ilo-ip'];
      modelServer['ilo-user'] = server['ilo-user'];
      modelServer['ilo-password'] = server['ilo-password'];
    }
    else {
      modelServers.push(server);
    }

    //save it to yaml file
    this.saveModelObjectData()
      .then((response) => {})
      .catch((error) => {
        let msg = translate('server.model.save.error');
        this.setErrorMessageContent(msg, error.toString());
        this.setState({showError: true});
      });
  }

  //save the updated model object
  saveModelObjectData() {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/clm/model', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.model)
      })
      .then((response) => this.checkResponse(response))
    );
  }

  //check if we have enough servers roles for the model
  validateServerRoleAssignment() {
    let valid = true;
    this.state.serverRoles.forEach((role) => {
      let minCount =  role.minCount;
      let memberCount = role.memberCount;
      let svrSize = role.servers.length;
      if (memberCount && svrSize !== memberCount && memberCount !== 0) {
        valid = false;
      }
      if(valid) {
        if(minCount && svrSize < minCount && minCount !== 0) {
          valid = false;
        }
      }
      //continue check if all server has enough inputs
      if(valid) {
        for (let idx in role.servers) {
          let server = role.servers[idx];
          let badInputs = this.checkInputKeys.find((key) => {
            return (server[key] === undefined || server[key] === '');
          });
          if(badInputs) {
            valid = false;
            break;
          }
        }
      }
    });
    if (!valid) {
      this.setState({pageValid: false});
    }
    else {
      this.setState({pageValid: true});
    }
  }

  setNextButtonDisabled() {
    return !this.state.pageValid;
  }

  doSave() {
    this.updateModelWithServerRoles();
    //save model and move to next page
    this.saveModelObjectData()
      .then((response) => {
        //go to next page when move this to goForward
        this.props.next(false);
      })
      .catch((error) => {
        //don't move if can't save model
        let msg = translate('server.model.save.error');
        this.setErrorMessageContent(msg, error.toString());
        this.setState({showError: true});
      });
  }

  //save model updates before move to next page
  goForward(e) {
    e.preventDefault();
    this.doSave();
  }

  renderErrorMessage() {
    return (
      <ErrorMessage
        closeAction={this.handleCloseMessageAction}
        show={this.state.showError} content={this.errorContent}>
      </ErrorMessage>
    );
  }

  renderLoadingMask() {
    return (
      <LoadingMask show={this.state.loading}></LoadingMask>
    );
  }

  renderAvailServersTable(servers) {
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

    let assignedServerIds = [];
    this.state.serverRoles.forEach((role) => {
      //clean up servers
      role.servers.forEach((server) => {
        assignedServerIds.push(server.id);
      });
    });

    //apply name and assignment filter here
    let filteredAvailableServers =
      servers.filter((server) => {
        if(server.name.indexOf(this.state.searchFilterText) === -1){
          return false;
        }

        //server name is acceptable per text filter, now need to filter out assigned servers
        return (assignedServerIds.indexOf(server.id) === -1);
      });

    return (
      <ServerTable
        id='left'
        tableConfig={tableConfig}
        tableData={filteredAvailableServers}
        customAction={this.handleShowServerDetails}>
      </ServerTable>
    )
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
          {this.renderAvailServersTable(this.state.displayAvailableServers)}
        </div>
      );
    }
  }

  renderManualDiscoverContent = () => {
    if (this.state.serversAddedManually.length > 0) {
      return (
        <div className='full-width'>
          {this.renderAvailServersTable(this.state.serversAddedManually)}
        </div>
      );
    } else {
      return (
        <div className='btn-row centered'>
          <ActionButton
            clickAction={this.handleAddServerManually}
            displayLabel={translate('add.server.add')}/>
          <ActionButton
            clickAction={this.handleAddServerFromCSV}
            displayLabel={translate('add.server.add.csv')}/>
        </div>
      );
    }
  }

  renderAvailableServersTabs() {
    return (
      <Tabs
        activeKey={this.state.tabKey}
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
      <ActionButton
        clickAction={this.handleConfDiscovery}
        displayLabel={translate('add.server.conf.discover')}/>
    );
  }

  renderSearchBar() {
    if (this.state.selectedServerTabKey === MANUALADD_TAB &&
      this.state.serversAddedManually.length > 0) {
      return (
        <div className='action-line'>
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
              <ActionButton
                clickAction={this.handleAddServerFromCSV}
                displayLabel={translate('add.server.add.csv')}/>
            </div>
          </div>
        </div>
      );
    } else if (this.state.selectedServerTabKey === AUTODISCOVER_TAB &&
      this.state.rawDiscoveredServers.length > 0) {
      return (
        <div className='action-line'>
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
        <SearchBar
          filterText={this.state.searchFilterText}
          filterAction={this.handleSearchText}>
        </SearchBar>
      );
    }
  }

  renderServerRolesAccordion(roles) {
    return (
      <ServerRolesAccordion
        ondropFunct={this.assignServerToRoleDnD.bind(this)}
        allowDropFunct={this.allowDrop.bind(this)}
        serverRoles={this.state.serverRoles}
        clickAction={this.handleClickRoleAccordion}
        tableId='right'
        checkInputs={this.checkInputKeys}
        displayPosition={this.state.accordionDisplayPosition}
        displayServers={this.state.displayAssignedServers}
        editAction={this.handleShowEditServerDetails}>
      </ServerRolesAccordion>
    );
  }

  renderServerRoleContent() {
    return (
      <div className='assign-server-role body-container'>
        <div className="server-container"
          onDrop={(event) => this.removeServerFromRoleDnD(event)}
          onDragOver={(event) => this.allowDrop(event, undefined)}>
          {this.renderSearchBar()}
          <div className="server-table-container rounded-corner">
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

  renderCredsInputContent() {
    return (
      <ConnectionCredsInfo
        cancelAction={this.handleCancelCredsInput} doneAction={this.handleDoneCredsInput}
        data={this.credentials}>
      </ConnectionCredsInfo>
    );
  }

  renderCredsInputModal() {
    return (
      <BaseInputModal
        show={this.state.showCredsModal}
        dialogClass='creds-dialog'
        cancelAction={this.handleCancelCredsInput}
        body={this.renderCredsInputContent()}
        title={translate('add.server.connection.creds')}>
      </BaseInputModal>
    );
  }

  renderEditServerInputContent() {
    return (
      <EditServerDetails
        cancelAction={this.handleCancelEditServerDetailsInput}
        doneAction={this.handleDoneEditServerDetailsInput}
        serverGroups={this.serverGroups}
        nicMappings={this.nicMappings}
        data={this.activeRowData}>
      </EditServerDetails>
    );
  }

  renderEditServerDetailsModal() {
    return (
      <BaseInputModal
        show={this.state.showEditServerDetailsModal}
        dialogClass='edit-details-dialog'
        cancelAction={this.handleCancelEditServerDetailsInput}
        body={this.renderEditServerInputContent()}
        title={translate('edit.server.details.heading')}>
      </BaseInputModal>
    );
  }

  render() {
    return (
      <div id='AssignServerRoleId' className='wizard-content'>
        {this.renderHeading(translate('add.server.heading', this.selectedModelName))}
        {this.renderServerRoleContent()}
        {this.renderNavButtons()}
        {this.renderCredsInputModal()}
        {this.renderAddServerManuallyModal()}
        {this.renderEditServerDetailsModal()}
        {this.renderLoadingMask()}
        {this.renderErrorMessage()}
      </div>
    );
  }
}

export default AssignServerRoles;
