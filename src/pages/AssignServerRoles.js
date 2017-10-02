import React from 'react';
import '../Deployer.css';
import Cookies from 'universal-cookie';
import { Tabs, Tab } from 'react-bootstrap';
import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import { ActionButton, LoadFileButton } from '../components/Buttons.js';
import { IpV4AddressValidator, MacAddressValidator } from '../utils/InputValidators.js';
import { SearchBar, ServerRolesAccordion, ServerInputLine, ServerDropdownLine }
  from '../components/ServerUtils.js';
import { BaseInputModal, ConfirmModal } from '../components/Modals.js';
import BaseWizardPage from './BaseWizardPage.js';
import ConnectionCredsInfo from '../components/ConnectionCredsInfo';
import { ErrorMessage } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';
import ServerTable from '../components/ServerTable.js';
import EditServerDetails from '../components/EditServerDetails.js';
import { importCSV } from '../utils/CsvImporter.js';
import { alphabetically } from '../utils/Sort.js';
import { fromJS } from 'immutable';

const AUTODISCOVER_TAB = 1;
const MANUALADD_TAB = 2;
const COOKIES = new Cookies();

class AssignServerRoles extends BaseWizardPage {

  constructor(props) {
    super(props);

    //variables
    this.checkInputKeys = [
      'nic-mapping',
      'server-group'
    ];
    // TODO: Remove this
    this.activeRowData = undefined;

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

    // TODO: These probably need to be moved into state, since they are modified by the user
    this.credentials = window.discoverCreds ? window.discoverCreds : {
      sm: {creds: {}},
      ov: {creds: {}}
    };

    // TODO: Remove this and use getSmUrl() to build this when needed
    this.smApiUrl = '';

    this.smApiToken = undefined;
    this.smSessionKey = undefined;

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

      // content of error to show
      errorContent: undefined,

      //show server details modal
      showServerDetailsModal: false,

      //show edit server details modal
      showEditServerDetailsModal: false,
    };
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

  setErrorMessageContent(title, message) {
    this.setState(prev => {
      if (prev.errorContent) {
        return ({errorContent: {
          title: prev.errorContent.title || title,
          messages: prev.errorContent.messages.concat(message)
        }})
      } else {
        return ({errorContent: {
          title: title,
          // Note: concat correctly handles message being a single string or an array
          messages: [].concat(message)
        }})
      }
    })
  }

  doSaveAllDiscoveredServers(servers) {
    this.deleteDiscoveredServers()
      .then((response) => {
      this.saveDiscoveredServers(servers)
        .then((response) => {})
        .catch((error) => {
          let msg = translate('server.discover.save.error');
          this.setErrorMessageContent(msg, error.toString());
        });
      })
      .catch((error) => {
        let msg = translate('server.discover.get.error');
        this.setErrorMessageContent(msg, error.toString());
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
        })
        .catch((error) => {
          this.setState({loading: false, errorContent: undefined});
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
        this.setState({validAddServerManuallyForm: true})
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
    })

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
    let body = '';
    const serverGroups = this.getServerGroups();
    const nicMappings = this.getNicMappings();
    let roles = this.getServerRoles().map(e => e['serverRole']);
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
    body = (
      <div>
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
      </div>
    );
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
        className={'manual-discover-modal'} onHide={this.cancelAddServerManuallyModal}
        body={body} footer={footer}/>
    );
  }

  sortServersById(servers) {
    return servers.sort((a, b) => {
      let x = a.name;
      let y = b.name;
      return ((x < y) ? -1 : (x > y) ? 1 : 0);
    });
  }

  handleAddServerFromCSV = file => {
    const restrictions = {
      'server-role': this.getServerRoles().map(e => e['serverRole']),
      'server-groups': this.getServerGroups(),
      'nic-mappings' : this.getNicMappings()
    };

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
          details.push("...");
        }

        let title = translate('csv.import.error');
        this.setErrorMessageContent(title, details);
      }

      this.saveServersAddedManually(results.data);
    });
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

  getSmUrl(host, port) {
    let url = 'https://' + host + ':' + (port <= 0 ? '8443' : port) + '/rpc/api';
    return url;
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
          this.setState({rawDiscoveredServers: resultServers, loading: false});
        })
        .catch((error) => {
          this.setState({loading: false});
        })
      }
  }

  handleShowServerDetails = (rowData) => {
    this.setState({showServerDetailsModal: true});
    this.activeRowData = rowData;
    //TODO need to get details based on source and id
    //then pop a modal
  }

  handleDoneEditServerDetailsInput = (server) => {
    //update model and save on the spot
    this.updateModelObjectForEditServer(server);

    //update servers and save to the backend
    this.updateServerForEditServer(server);

    this.setState({ showEditServerDetailsModal: false });
    this.activeRowData = undefined;
  }

  handleCancelEditServerDetailsInput = (editData) => {
    this.setState({
      showEditServerDetailsModal: false
    });
    this.activeRowData = undefined;
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
        this.getServerRoles(rawServerData);
      })
      .catch((error) => {
        let msg = translate('server.discover.get.error');
        this.setErrorMessageContent(msg, error.toString());
        //still get model
        this.getServerRoles();
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

  getServerGroups = () => {
    // the input model's server-groups section is a list, each of which may optionally
    //    in contain a list of server-groups.  Gather them altogether into
    //    a single list (using map and reduce), and sort by name
    return this.props.model.getIn(['inputModel', 'server-groups']).map(e => e.get('server-groups') || [])
      .reduce((a,b) => a.concat(b))   // Reduce array of arrays to a single flattened array
      .toJS()                         // Convert from immutable to standard JS object
      .sort(alphabetically);
  }

  getNicMappings = () => {
    return this.props.model.getIn(['inputModel','nic-mappings']).map(e => e.get('name'))
      .toJS()                         // Convert from immutable to standard JS object
      .sort(alphabetically);
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


  // Retrieve summarized server role information from the model
  // Each element in this list is an object containing:
  // - name        : the displayed name, such as "compute"
  // - serverRole  : the role name, such as "COMPUTE-ROLE"
  // - servers[]   : list of servers that have the role
  // - minCount    : minimum count of servers in the role
  //     or
  // - memberCount : exact count of servers in the role
  // - group       : 'clusters' or 'resources' (the type of role)
  byServerNameOrId = (a,b) => {
    return alphabetically(a['name'] || a['id'], b['name'] || b['id']);
  }

  getServerRoles = () => {
    const servers = this.props.model.getIn(['inputModel', 'servers']).toJS();

    // TODO: Handle multiple control planes
    const cpData = this.props.model.getIn(['inputModel', 'control-planes', '0']).toJS();

    let results = [];
    for (let group of ['clusters','resources']) {
      results = results.concat(cpData[group].map((res) => {
        let role = {
          'name': res['name'],
          'serverRole': res['server-role'],
          'group': group,
          'servers': servers
                      .filter(s => s.role === res['server-role'])
                      .map(s => this.getCleanedServer(s))          // filter out any extra fields
                      .sort((a,b) => this.byServerNameOrId(a,b))   // sort servers by name or id within each role
        };
        if (group === 'clusters')
          role['memberCount'] = res['member-count'] || 0;
        else
          role['minCount'] = res['min-count'] || 0;
        return role;
      }));
    }

    // Sort the role list by role name
    return results.sort((a,b) => alphabetically(a['name'],b['name']));
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
   * assign a server to a particular role in the datamodel, then update the model and save it
   *
   * @param {Object} server - data object representing the server and its known metadata
   * @param {string} role - the role that the server is to be assigned to as it matches the model (not the user-friendly translation)
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
        }
      ));
    }
    this.props.updateGlobalState('model', model);
  }

  /**
   * trigger server assignment to a role via drag and drop. parses the payload of a ServerRowItem drag event
   * and adds the represented server to the role specified
   *
   * @param {event} event - the browser event for the drop action, should contain a data JSON object per ServerRowItem.js
   * @param {string} role - the role to assign the server to
   */
  assignServerToRoleDnD = (event, role) => {
    let serverData = JSON.parse(event.dataTransfer.getData("data"));

    this.assignServerToRole(serverData, role);
    this.unHighlightDrop(event, true);
  }

  /**
   * removes a server from a specified model role, parses the payload of a ServerRowItem drag event for data
   * and them removes the represented server to the role specified
   *
   * @param {event} event - the browser event for the drop action, should contain a data JSON object per ServerRowItem.js
   */
  removeServerFromRoleDnD = (event) => {
    let serverData = JSON.parse(event.dataTransfer.getData("data"));
    this.removeServerFromRole(serverData, serverData.role);

    this.unHighlightDrop(event, true);
  }

  /**
   * remove a server from a particular role in the datamodel, then update the model and save it
   *
   * @param {Object} server - data object representing the server and its known metadata
   * @param {String} role - the role that the server is to be assigned to as it matches the model (not the user-friendly translation)
   */
  removeServerFromRole = (server, role) => {

    // Remove the server from the model
    const model = this.props.model.updateIn(['inputModel', 'servers'], list => list.filter(svr => svr.get('id') != server.id))
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
    let element = $(event.target);
    if(!element.hasClass('server-dropzone')){
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
    let element = $(event.target);
    if(!element.hasClass('server-dropzone')){
      element = element.closest('.server-dropzone');
    }
    if(forceclear ||
       element.offset().left > event.pageX ||
       element.offset().left + element.width() < event.pageX ||
       element.offset().top >= event.pageY ||
       element.offset().top + element.height() <= event.pageY){
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
            this.setErrorMessageContent(msg, error.toString());
          });
        });
        break;
      }
    };
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
      }
      model = model.mergeIn(['inputModel', 'servers', index], update_svr);
    } else {
      model = model.updateIn(['inputModel', 'servers'], list => list.push(fromJS(server)));
    }

    this.props.updateGlobalState('model', model);
  }

  //check if we have enough servers roles for the model
  isValid = () => {
    return this.getServerRoles().every(role => {
      let minCount =  role.minCount;
      let memberCount = role.memberCount;
      let svrSize = role.servers.length;
      if (memberCount && svrSize !== memberCount) {
        return false;
      }
      if(minCount && svrSize < minCount) {
        return false;
      }
      // verify that each server object in role.servers has all of the required keys
      return role.servers.every(server => this.checkInputKeys.every(key => (server[key] ? true : false)));
    });
  }

  setNextButtonDisabled = () => !this.isValid();

  clearErrorMessage = () => {
    this.setState({errorContent: undefined});
  }

  renderErrorMessage() {
    if (this.state.errorContent) {
      return (
        <ErrorMessage
          closeAction={this.clearErrorMessage}
          title={this.state.errorContent.title}
          message={this.state.errorContent.messages}>
        </ErrorMessage>
      );
    }
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

    const assignedServerIds = this.props.model.getIn(['inputModel','servers'])
      .filter(svr => (svr.get('role') ? true : false))    // find servers with roles
      .map(svr => svr.get('id')).toJS();                  // return just the id field

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
          {this.renderAvailServersTable(this.state.rawDiscoveredServers)}
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
        ondropFunct={this.assignServerToRoleDnD}
        ondragEnterFunct={this.highlightDrop}
        ondragLeaveFunct={this.unHighlightDrop}
        allowDropFunct={this.allowDrop}
        serverRoles={this.getServerRoles()}
        tableId='right'
        checkInputs={this.checkInputKeys}
        editAction={this.handleShowEditServerDetails}>
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
        serverGroups={this.getServerGroups()}
        nicMappings={this.getNicMappings()}
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
      <div className='wizard-page'>
        <div id='AssignServerRoleId' className='wizard-content'>
          {this.renderHeading(translate('add.server.heading', this.props.model.get('name')))}
          {this.renderServerRoleContent()}
          {this.renderCredsInputModal()}
          {this.renderAddServerManuallyModal()}
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
