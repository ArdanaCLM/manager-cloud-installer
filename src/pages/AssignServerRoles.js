import React from 'react';
import '../Deployer.css';
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

const AUTODISCOVER_TAB = 1;
const MANUALADD_TAB = 2;

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
    this.newServer = Array(5).fill(null);

    //save it in session for now
    this.credentials = {
      suma: {
        token:  undefined,
        creds: {
          username: '',
          password: '',
          host: '',
          port: 0,
        },
      },
      oneview: {
        creds: {
          username: '',
          password: '',
          host: '',
          port: 0,
        },
      }
    };

    //states changes will rerender UI
    this.state = {
      //server list on the available servers side
      //could be filtered
      displayAvailableServers: [],
      //server list on the assigned servers side
      //also changed when select role
      displayAssignedServers: [],
      //when assign and unassign servers, the display
      //of selected role will be changed
      selectedServerRole:'',
      //selected list on the available servers side
      selectedAvailableServersRows: [],
      //selected list on the assigned servers side
      selectedAssignedServersRows: [],
      //when assign or unassign or discover the filter
      //text could be cleared
      searchFilterText: '',
      //turn on/off next
      pageValid: false,
      //what tab key selected
      selectedAddServerTabKey: AUTODISCOVER_TAB,
      //show or not credentials modal
      showCredsModal: false,

      // Add Server Manually modal
      showAddServerManuallyModal: false,
      validAddServerManuallyForm: false,
      serversAddedManually: [],

      // show Add Server From CSV modal
      showAddFromCSVModal: false,
    };

    this.handleDiscovery = this.handleDiscovery.bind(this);
    this.handleAssignServer = this.handleAssignServer.bind(this);
    this.handleUnAssignServer = this.handleUnAssignServer.bind(this);
    this.handleSearchText = this.handleSearchText.bind(this);
    this.handleAvailableServerRowSelect = this.handleAvailableServerRowSelect.bind(this);
    this.handleAssignedServerRowSelect = this.handleAssignedServerRowSelect.bind(this);

    this.handleAvailableServerShowMenu = this.handleAvailableServerShowMenu.bind(this);
    this.handleAssignedServerShowMenu = this.handleAssignedServerShowMenu.bind(this);
    this.handleAssignedServerShowEdit = this.handleAssignedServerShowEdit.bind(this);
    this.handleShowDetail = this.handleShowDetail.bind(this);
    this.handleEditDetailCancel = this.handleEditDetailCancel.bind(this);
    this.handleEditDetailDone = this.handleEditDetailDone.bind(this);

    this.handleSelectAddServerTab = this.handleSelectAddServerTab.bind(this);
    this.handleClickRoleAccordion = this.handleClickRoleAccordion.bind(this);
    //this.handleManualAddServer = this.handleManualAddServer.bind(this);
    this.handleAddServerFromCSV = this.handleAddServerFromCSV.bind(this);
    this.handleInitDiscovery = this.handleInitDiscovery.bind(this);
    this.handleDoneCredsInput = this.handleDoneCredsInput.bind(this);
    this.handleCancelCredsInput = this.handleCancelCredsInput.bind(this);
  }

  refreshServers(rawServerData) {
    this.setState({
      displayAssignedServers: [], //
      displayAvailableServers: [],
      searchFilterText: '',
      selectedAvailableServersRows: [],
      selectedAssignedServersRows: []
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

  getAvailableServersData() {
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/sm/servers')
        .then(response => response.json())
    );
  }

  handleDiscovery() {
    this.getAvailableServersData()
      .then((rawServerData) => {
        if (rawServerData && rawServerData.length > 0) {
          let ids = rawServerData.map((srv) => {
            return srv.id;
          });

          this.getAllServerDetailsData(ids)
            .then((details) => {
              rawServerData = this.updateServerDataWithDetails(details);
              this.refreshServers(rawServerData);
            })
            .catch((error) => {
              //TODO remove
              console.error('Failed to get all servers details data');
            });
        }
      })
      .catch((error) => {
        //TODO remove
        console.error('Failed to get available data');
      });
  }

  //assign selected servers to server role
  handleAssignServer() {
    let selectedSvrRole = this.state.selectedServerRole;
    let serverRole = this.serverRoles.find((role) => {
      return (selectedSvrRole === role.serverRole);
    });
    if(serverRole) {
      let selAvailableSvrs = this.state.selectedAvailableServersRows;
      let assignedServers = serverRole.servers;
      serverRole.servers = assignedServers.concat(selAvailableSvrs);

      let assignedIds = serverRole.servers.map((svr) => {
        return svr.id;
      });
      let tempAvailableSvrs = this.state.displayAvailableServers.filter((srv) => {
        //find one which is not assigned
        return (assignedIds.indexOf(srv.id) === -1);
      });

      //update available servers
      this.setState({
        displayAssignedServers: serverRole.servers,
        displayAvailableServers: tempAvailableSvrs,
        searchFilterText: '',
        selectedAvailableServersRows: [],
        selectedAssignedServersRows: []
      });
      //check if we meet the model object server role
      //min requirements
      this.validateServerRoleAssignment();
    }
  }

  //unassign selected servers from server role
  handleUnAssignServer() {
    let selectedSvrRole = this.state.selectedServerRole;
    let serverRole = this.serverRoles.find((role) => {
      return (selectedSvrRole === role.serverRole);
    });

    if(serverRole) {
      let selAssignedSvrs = this.state.selectedAssignedServersRows;
      let displayAvailableSvrs = this.state.displayAvailableServers;

      //update available servers)
      this.setState({
        displayAvailableServers: displayAvailableSvrs.concat(selAssignedSvrs)
      });

      let selectedIds = selAssignedSvrs.map((svr) => {
        return svr.id;
      });

      let displayAssignedSvrs = serverRole.servers.filter((svr) => {
        //find one which is not selected
        return (selectedIds.indexOf(svr.id) === -1);
      });

      serverRole.servers = displayAssignedSvrs;
      this.setState({
        displayAssignedServers: displayAssignedSvrs,
        searchFilterText: '',
        selectedAvailableServersRows: [],
        selectedAssignedServersRows: []
      });

      //check if we meet the model object server role
      //min requirements
      this.validateServerRoleAssignment();
    }
  }

  //handle click single row on available servers
  handleAvailableServerRowSelect(isChecked, row) {
    let selected = this.state.selectedAvailableServersRows.slice();
    if(isChecked) {
      selected.push(row);
    }
    else {
      let idx =
        selected.findIndex((aRow) => {
          return row.id === aRow.id;
        });

      if(idx !== -1) {
        selected.splice(idx, 1);
      }
    }
    this.setState({
      selectedAvailableServersRows : selected
    });
  }

  //handle click single row on assigned servers
  handleAssignedServerRowSelect(isChecked, row) {
    let selected = this.state.selectedAssignedServersRows.slice();
    if(isChecked) {
      selected.push(row);
    }
    else {
      let idx =
        selected.findIndex((aRow) => {
          return row.id === aRow.id;
        });

      if(idx !== -1) {
        this.selected.splice(idx, 1);
      }
    }
    this.setState({
      selectedAssignedServersRows : selected
    });
  }

  //handle filter text change
  handleSearchText(filterText) {
    this.setState({
      searchFilterText: filterText,
      selectedAvailableServersRows: []
    });
  }

  //handle menu clicks
  handleAvailableServerShowMenu(e, rowData) {
    let tempData = {};
    Object.assign(tempData, rowData);
    this.setState({
      showAvailableContextMenu: true
    });
    this.contextMenuLocation = {x : e.pageX, y: e.pageY};
    this.activeRowData = tempData;
  }

  handleAssignedServerShowMenu(e, rowData) {
    let tempData = {};
    Object.assign(tempData, rowData);
    tempData.role = this.state.selectedServerRole;
    this.setState({
      showAssignedContextMenu: true
    });
    this.activeRowData = tempData;
    this.contextMenuLocation = {x : e.pageX, y: e.pageY};
  }

  handleAssignedServerShowEdit() {
    this.setState({
      showEditDetails: true,
      showAssignedContextMenu: false
    });
  }

  handleSelectAddServerTab(tabKey) {
    this.setState({selectedAddServerTabKey: tabKey});
  }

  handleClickRoleAccordion(role) {
    //TODO
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
      if (props.inputName === 'id') {
        this.newServer[0] = value;
        console.log('newServer.id: ' + value);
      } else {
        this.newServer[1] = value;
        console.log('newServer.ip: ' + value);
      }
      if (this.newServer[0] && this.newServer[1]) {
        this.setState({validAddServerManuallyForm: true})
      }
    } else {
      console.log('invalid value: ' + value);
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
    this.newServer[2] = role;
  }

  handleSelectGroup = (group) => {
    this.newServer[3] = group;
  }

  handleSelectNicMapping = (nicmapping) => {
    this.newServer[4] = nicmapping;
  }

  closeAddServerManuallyModal = () => {
    console.log('close modal');
    this.setState({showAddServerManuallyModal: false});
  }

  convertListToObj(server) {
//    return servers.map((server) => {
      return {
        name: server[0],
        ip: server[1],
        serverRole: server[2],
        serverGroup: server[3],
        nicMapping: server[4]
      };
//    });
  }

  convertDictionaryToList(dict) {
    let servers = [];
    dict.map((item) => {
      let server = [];
      for (let key in item) {
        if (key === 'name') {
          server[0] = item[key];
        } else if (key == 'ip') {
          server[1] = item[key];
        } else if (key == 'serverRole') {
          server[2] = item[key];
        } else if (key == 'serverGroup') {
          server[3] = item[key];
        } else if (key == 'nicMapping') {
          server[4] = item[key];
        }
      }
      servers.push(server);
    });
    return servers;
  }

  saveServerAddedManually = () => {
    let newServerObj = this.convertListToObj(this.newServer);
//    let newServers = this.state.serversAddedManually.concat([newServerObj]);
    this.setState((prevState) => {
      return {serversAddedManually: prevState.serversAddedManually.concat([newServerObj])};
    });
    console.log('save server');
//    let serverDict = this.convertListToObj(newServers);
    fetch(getAppConfig('shimurl') + '/api/v1/server', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
//      body: JSON.stringify(serverDict)
      body: JSON.stringify(newServerObj)
      })

    this.closeAddServerManuallyModal();
  }

  addMoreServer() {
    console.log('add more server');
  }

  renderAddServerManuallyModal = () => {
    let body = '';
    if (this.serverRoles && this.serverGroups && this.nicMappings) {
      let roles = this.serverRoles.map((server) => {return server.serverRole});
      // initialize data column, ordered by what will show in table
      if (this.newServer[2] === null) {
        this.newServer[2] = roles[0];
      }
      if (this.newServer[3] === null) {
        this.newServer[3] = this.serverGroups[0];
      }
      if (this.newServer[4] === null) {
        this.newServer[4] = this.nicMappings[0];
      }
      body = (
        <div className='server-details-container'>
          {this.renderInputLine('server.id.name.prompt', 'id', 'text')}
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

  renderServersAddedManuallyTable = () => {
    let rows = [];

    // create table header
    let headerRow = [];
    let colHeaders = ['id.name', 'ip.address', 'role', 'group', 'nicmapping'];
    let headers = colHeaders.map(header => translate('server.' + header + '.prompt').toString());
    headers.map((header, index) => {headerRow.push(<th key={index}>{header}</th>);});
    rows.push(<tr key='headerRow'>{headerRow}</tr>);

    // create data rows
    let servers = this.convertDictionaryToList(this.state.serversAddedManually);
    for (let i=0; i<servers.length; i++) {
      let dataRow = [];
      servers[i].map((col, index) => {
        dataRow.push(<td key={i+index}>{col}</td>);
      });
      rows.push(<tr key={i}>{dataRow}</tr>);
    }

    return (rows);
  }

  handleAddServerFromCSV() {
    //TODO
  }

  handleInitDiscovery() {
    this.setState({showCredsModal: true});
  }

  handleCancelCredsInput() {
    this.setState({showCredsModal: false});
  }

  //TODO
  handleDoneCredsInput(credsData) {
    this.setState({
      showCredsModal: false,
    });
    if(credsData.suma) {
      this.credentials.suma = credsData.suma;
    }
    if(credsData.oneview) {
      this.credentials.oneview = credsData.oneview;
    }
    //TODO if don't have available server...run discovery with creds info
  }

  //TODO doesn't do anything yet
  handleShowDetail() {
    this.setState({
      showDetails: true,
      showAssignedContextMenu: false,
      showAvailableContextMenu: false
    });
  }

  handleEditDetailDone(editData) {
    let roles = this.serverRoles;
    let findRole = roles.find((role) => {
      return role.serverRole === editData.role;
    });

    if(findRole) {
      let server = findRole.servers.find((srv) => {
        return srv.id === editData.id;
      });
      if(server) {
        //only change part of it
        //TODO should allow to edit ip-addr or mac-addr?
        server['ip-addr'] = editData['ip-addr'];
        server['mac-addr'] = editData['mac-addr'];
        //TODO when we unassign...should we clean the following
        server['server-group'] = editData['server-group'];
        server['nic-mapping'] = editData['nic-mapping'];
        server['ilo-ip'] = editData['ilo-ip'];
        server['ilo-user'] = editData['ilo-user'];
        server['ilo-password'] = editData['ilo-password'];
      }
    }

    this.setState({
      showEditDetails: false,
      selectedAvailableServersRows: [],
      selectedAssignedServersRows: []
    });
    this.activeRowData = undefined;

    this.validateServerRoleAssignment();
  }

  handleEditDetailCancel(editData) {
    this.setState({
      showEditDetails: false,
      selectedAvailableServersRows: [],
      selectedAssignedServersRows: []
    });
    this.activeRowData = undefined;

    this.validateServerRoleAssignment();
  }

  //get model object before render UI
  componentWillMount() {
    try {
      this.credentials.suma.token = apiToken; //global suma token TODO
    } catch (ReferenceError) {}

    this.getModelObjectData()
      .then((modelData) => {
        this.model = modelData;
        this.getServerGroups(modelData);
        this.getNicMappings(modelData);
        this.getServerRoles(modelData);
        this.validateServerRoleAssignment();
      })
      .catch((error) => {
        //TODO remove
        console.error('Failed to get model object data');
        console.error(JSON.stringify(error));
      });

    fetch(getAppConfig('shimurl') + '/api/v1/server')
      .then(response => response.json())
      .then((responseData) => {
        if (responseData.length > 0) {
          console.log('got some servers');
          this.setState({serversAddedManually: responseData});
        }
      });
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

  updateServerDataWithDetails(details) {
    //details has everything
    let retData = details.map((srvDetail) => {
      let nkdevice = srvDetail.network_devices.find((device) => {
        return device.interface === 'eth0'; //TODO
      });
      //at this point only these are useful
      let serverData = {
        'id': srvDetail.id + '', //make it a string instead of number
        'name': srvDetail.name,
        'ip-addr': nkdevice.ip,
        'mac-addr': nkdevice['hardware_address']
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
    //for prototye...handle one for now
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
              'ip-addr': srv['ip-addr'],
              'name': srv.name ? srv.name : strId,
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
      this.setState({
        selectedServerRole: allRoles[displayIdx].serverRole,
        displayAssignedServers: displayAssignedSrv,
        displayAvailableServers: displayAvailableSrv
      });
    }
  }

  //prototype query SUMA for details
  getOneServerDetailData(url) {
    let promise = new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.json())
        .then((responseData) => {
          resolve(responseData);
        })
        .catch(error => {
          //TODO remove
          console.error('Failed to get one server details data');
        });
    });
    return promise;
  }

  //prototype issue queries to SUMA for all the details
  getAllServerDetailsData(serverIds) {
    let promises = [];
    serverIds.forEach((id) => {
      //TODO make it constant
      let url = getAppConfig('shimurl') + '/api/v1/sm/servers/' + id;
      promises.push(this.getOneServerDetailData(url));
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
        //TODO this just prototype we can update model
        //don't need to go through each of once we have a way
        //to update each server input ilo stuffs
        servers.forEach((svr, idx) => {
          //update model
          modelServers.push({
            'id': svr.id,
            'name': svr.name || '',
            'role': role.serverRole,
            'ip-addr': svr['ip-addr'],
            'mac-addr': svr['mac-addr'],
            //TODO need real data...will have user input later
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
        .then(response => response.json())
    );
  }

  //save the updated model object
  saveModelObjectData() {
    let modl = this.model;
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/clm/model', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(modl)
      })
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
        if(response && response.ok === false) {
          //TODO remove
          console.error('Failed to save model object data');
          this.props.next(true);
        }
        else {
          //go to next page when move this to goForward
          this.props.next(false);
        }
      })
      .catch((error) => {
        //TODO handle error
        this.props.next(true); //set error
        //TODO remove
        console.error('Failed to save model object data');
      });
  }

  //save model updates before move to next page
  goForward(e) {
    e.preventDefault();
    this.doSave();
  }

  renderAvailServersTable() {
    return <div>TODO</div>;
  }

  renderAutoDiscoverContent() {
    if(!this.state.displayAvailableServers ||
      this.state.displayAvailableServers.length === 0) {
      return (
        <div className='centered'>
          <ActionButton
            clickAction={this.handleInitDiscovery}
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
    // TODO add relocation of buttons next to the search bar when there're data in the table
    if (this.state.serversAddedManually.length > 0) {
      console.log('servers added manually count: ' + this.state.serversAddedManually.length);
      return (
        <div className='rounded-corner'>
          <table className='add-server-manually-table'>
            <tbody>{this.renderServersAddedManuallyTable()}</tbody>
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
        onSelect={this.handleSelectAddServerTab} id='AvailableServerTabsId'>
        <Tab
          eventKey={AUTODISCOVER_TAB} title={translate('add.server.auto.discover')}>
          {this.renderAutoDiscoverContent()}
        </Tab>
        <Tab
          eventKey={MANUALADD_TAB} title={translate('add.server.manual.add')}>
          {this.renderManualDiscoverContent()}
        </Tab>
      </Tabs>
    );
  }

  renderSearchBar() {
    if (this.state.selectedAddServerTabKey === MANUALADD_TAB &&
      this.state.serversAddedManually.length > 0) {
      console.log('in Add Manually tab, have server');
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
    } else {
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
        serverRoles={this.serverRoles} clickAction={this.handleClickRoleAccordion}>
      </ServerRolesAccordion>
    );
  }

  renderServerRoleContent() {
    return (
      <div className='assign-server-role body-container'>
        <div className="server-container">
          {this.renderSearchBar()}
          <div className="server-table-container rounded-box">
            {this.renderAvailableServersTabs()}
          </div>
        </div>
        <div className="server-container">
          <div className="server-table-container role-accordion-container rounded-box">
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
        body={this.renderCredsInputContent()} title={translate('add.server.connection.creds')}>
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
      </div>
    );
  }
}

export default AssignServerRoles;
