import React from 'react';
import '../Deployer.css';
import Cookies from 'universal-cookie';
import { Tabs, Tab } from 'react-bootstrap';
import { translate } from '../localization/localize.js';
import { getAppConfig } from '../components/ConfigHelper.js';
import { ActionButton } from '../components/Buttons.js';
import { IpV4AddressValidator } from '../components/InputValidators.js';
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
    this.serverRoles = [];
    this.selectedModelName = this.props.selectedModelName;
    this.checkInputKeys = [
      'ilo-ip',
      'ilo-user',
      'ilo-password',
      'nic-mapping',
      'server-group'
    ];
    this.activeRowData = undefined;
    this.newServer = {};
    this.errorContent = undefined;

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

      rawDiscoveredServers: []
    };

    this.handleAddServerFromCSV = this.handleAddServerFromCSV.bind(this);
  }

  refreshServers(rawServerData) {
    this.setState({
      displayAssignedServers: [],
      displayAvailableServers: [],
      searchFilterText: ''
    });

    this.serverRoles.forEach((role) => {
      //clean up servers
      role.servers = [];
    });

    //this will parse model and
    //consolidate availableServers and assignedServers
    this.getServerRoles(this.model, rawServerData);
    this.validateServerRoleAssignment();
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
          this.saveDiscoveredServers(resultServers)
            .then((response) => {})
            .catch((error) => {
              let msg = translate('server.discover.get');
              this.setErrorMessageContent(msg, error.toString());
            });
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

  renderInputLine(title, name, type, validator) {
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{translate(title) + '*'}</div>
        <div className='input-body'>
          <ServerInput isRequired={true} inputName={name} inputType={type} inputValidate={validator}
            inputAction={this.handleInputLine}/>
        </div>
      </div>
    );
  }

  handleInputLine = (e, valid, props) => {
    let value = e.target.value;
    if (valid) {
      if (props.inputName === 'name') {
        this.newServer.name = value;
      } else {
        this.newServer.ip = value;
      }
      if (this.newServer.name && this.newServer.ip) {
        this.setState({validAddServerManuallyForm: true})
      }
    } else {
      this.setState({validAddServerManuallyForm: false});
    }
  }

  renderDropdownLine(title, name, value, list, handler) {
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{translate(title) + '*'}</div>
        <div className='input-body'>
          <ServerDropdown name={name} value={value} optionList={list} selectAction={handler}/>
        </div>
      </div>
    );
  }

  handleSelectRole = (role) => {
    this.newServer.serverRole = role;
  }

  handleSelectGroup = (group) => {
    this.newServer.serverGroup = group;
  }

  handleSelectNicMapping = (nicmapping) => {
    this.newServer.nicMapping = nicmapping;
  }

  closeAddServerManuallyModal = () => {
    this.setState({showAddServerManuallyModal: false});
  }

  saveServerAddedManually = () => {
    let serverList = [this.newServer];  //save this.newServer to prevent race condition below
    this.setState((prevState) => {
      return {serversAddedManually: prevState.serversAddedManually.concat(serverList)};
    });
    fetch(getAppConfig('shimurl') + '/api/v1/server', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.newServer)
      })

    this.newServer = {};
    this.closeAddServerManuallyModal();
  }

  addMoreServer() {
    console.log('add more server');
  }

  getSmUrl(host, port) {
    let url = 'https://' + host + ':' + (port <= 0 ? '8443' : port) + '/rpc/api';
    return url;
  }

  renderAddServerManuallyModal = () => {
    let body = '';
    if (this.serverRoles && this.serverGroups && this.nicMappings) {
      let roles = this.serverRoles.map((server) => {return server.serverRole});
      if (!this.newServer.serverRole) {
        this.newServer.serverRole = roles[0];
      }
      if (!this.newServer.serverGroup) {
        this.newServer.serverGroup = this.serverGroups[0];
      }
      if (!this.newServer.nicMapping) {
        this.newServer.nicMapping = this.nicMappings[0];
      }
      body = (
        <div className='server-details-container'>
          {this.renderInputLine('server.id.name.prompt', 'name', 'text')}
          {this.renderInputLine('server.ip.address.prompt', 'ip', 'text', IpV4AddressValidator)}
          {this.renderDropdownLine('server.role.prompt', 'role', roles[0], roles,
            this.handleSelectRole)}
          {this.renderDropdownLine('server.group.prompt', 'group', this.serverGroups[0],
            this.serverGroups, this.handleSelectGroup)}
          {this.renderDropdownLine('server.nicmapping.prompt', 'nicmapping', this.nicMappings[0],
            this.nicMappings, this.handleSelectNicMapping)}
        </div>
      );
    }
    let footer = (
      <div className='btn-row'>
        <ActionButton clickAction={this.closeAddServerManuallyModal}
          displayLabel={translate('cancel')}/>
        <ActionButton clickAction={this.saveServerAddedManually} displayLabel={translate('save')}
          isDisabled={!this.state.validAddServerManuallyForm}/>
        <ActionButton clickAction={this.addMoreServer} displayLabel={translate('add.more')}/>
      </div>
    );
    return (
      <ConfirmModal show={this.state.showAddServerManuallyModal} title={translate('add.server.add')}
        className={'manual-discover-modal'} body={body} footer={footer}/>
    );
  }

  renderManualDiscoverTable = () => {
    let rows = [];

    // create table header
    let headerRow = [];
    let colHeaders = ['id.name', 'ip.address', 'role', 'group', 'nicmapping'];
    let headers = colHeaders.map(header => translate('server.' + header + '.prompt').toString());
    headers.map((header, index) => {headerRow.push(<th key={index}>{header}</th>);});
    rows.push(<tr key='headerRow'>{headerRow}</tr>);

    // create data rows
    let servers = this.state.serversAddedManually;
    servers.map((server, index) => {
      let dataRow = [];
      dataRow.push(<td key={index+server.name}>{server.name}</td>);
      dataRow.push(<td key={index+server.ip}>{server.ip}</td>);
      dataRow.push(<td key={index+server.serverRole}>{server.serverRole}</td>);
      dataRow.push(<td key={index+server.serverGroup}>{server.serverGroup}</td>);
      dataRow.push(<td key={index+server.nicMapping}>{server.nicMapping}</td>);
      rows.push(<tr key={index}>{dataRow}</tr>);
    });

    return (rows);
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
      //save port cookie if have port
      let port = this.credentials.sm.creds.port > 0 ? this.credentials.sm.creds.port : '8443';
      COOKIES.set('suseManagerPort', port, {path: '/', expires: expDate});
      this.smApiUrl = this.getSmUrl(this.credentials.sm.creds.host, this.credentials.sm.creds.port);
      this.smSessionKey = this.credentials.sm.sessionKey;
    }
    if (credsData.ov) {
      this.credentials.ov = credsData.ov;
      //TODO save sessionKey
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
          this.setState({rawDiscoveredServers: resultServers});
          //save it to the backend
          this.saveDiscoveredServers(resultServers)
          .then((response) => {})
          .catch((error) => {
            let msg = translate('server.discover.save');
            this.setErrorMessageContent(msg, error.toString());
          });
          this.refreshServers(resultServers);
          this.setState({loading: false});
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
    let roles = this.serverRoles;
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

  handleClickRoleAccordion = (role) => {
    this.selectedServerRole = role.serverRole;
  }

  //TODO
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
    fetch(getAppConfig('shimurl') + '/api/v1/server')
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
      });
  }
  getSavedDiscoveredServers() {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/discovered_servers')
        .then((response) => this.checkResponse(response))
        .then(response => response.json())
    );
  }

  saveDiscoveredServers(resultServers) {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/discovered_servers', {
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
      let serverData = {
        'id': srvDetail.id + '', //make it a string instead of number
        'name': srvDetail.name,
        'ip-addr': nkdevice.ip,
        'mac-addr': nkdevice.hardware_address,
        'cpu': srvDetail.cpu_info.count,
        'ram': srvDetail.ram,
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
      let displayAssignedSrv = [];
      let allAssignedSrvIds = [];
      let displayIdx = 0;
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

          let retIds = matchedModelSvrs.map((srv) => {
            return srv.id + ''; //make it string
          });
          allAssignedSrvIds = allAssignedSrvIds.concat(retIds);

          role.servers = servers;
          //TODO
          //as refresh and reloading find first one that has assigned role
          //selected role's assigned servers
          if((role.servers && role.servers.length > 0) &&
            displayAssignedSrv.length === 0) {
            displayAssignedSrv = servers;
            displayIdx = idx;
          }
        }
      });

      //only show the available servers that are not assigned
      let displayAvailableSrv = [];
      if(rawServerData && rawServerData.length > 0) {
        displayAvailableSrv = rawServerData.filter((server) => {
          return (allAssignedSrvIds.indexOf(server.id) === -1);
        });
      }

      this.serverRoles = allRoles;
      this.selectedServerRole = allRoles[displayIdx].serverRole;
      this.setState({
        displayAssignedServers: displayAssignedSrv,
        displayAvailableServers: displayAvailableSrv
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

  //update the model servers based on
  //server role assginment
  updateModelWithServerRoles() {
    let serverRoles = this.serverRoles;
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
    this.serverRoles.forEach((role) => {
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

  renderAvailServersTable() {
    //displayed columns
    let tableConfig = {
      columns: [
        {name: 'id', hidden: true},
        {name: 'name'},
        {name: 'ip-addr',},
        {name: 'mac-addr'},
        {name: 'cpu'},
        {name: 'ram'},
        {name: 'source', hidden: true}
      ]
    };

    //apply simple name filter here
    let filteredAvailableServers =
      this.state.displayAvailableServers.filter((server) => {
        return (server.name.indexOf(this.state.searchFilterText) !== -1);
      });

    return (
      <div className='rounded-corner'>
        <ServerTable
          id='left'
          tableConfig={tableConfig}
          tableData={filteredAvailableServers}
          customAction={this.handleShowServerDetails}>
        </ServerTable>
      </div>
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
          {this.renderAvailServersTable()}
        </div>
      );
    }
  }

  renderManualDiscoverContent = () => {
    if (this.state.serversAddedManually.length > 0) {
      return (
        <div className='rounded-corner'>
          <table className='add-server-manually-table'>
            <tbody>{this.renderManualDiscoverTable()}</tbody>
          </table>
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
        serverRoles={this.serverRoles}
        clickAction={this.handleClickRoleAccordion}
        tableId='right'
        displayServers={this.state.displayAssignedServers}
        editAction={this.handleShowEditServerDetails}>
      </ServerRolesAccordion>
    );
  }

  renderServerRoleContent() {
    return (
      <div className='assign-server-role body-container'>
        <div className="server-container">
          {this.renderSearchBar()}
          <div className="server-table-container rounded-corner">
            {this.renderAvailableServersTabs()}
          </div>
        </div>
        <div className="server-container">
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
