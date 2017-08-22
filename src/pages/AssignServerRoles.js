import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import {
  ActionButton, AssignButton, UnAssignButton, ItemMenuButton
} from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';
import EditServerDetails from './EditServerDetails.js';
import ContextMenu from '../components/ContextMenu.js';

class AssignServerRoles extends BaseWizardPage {

  constructor(props) {
    super(props);

    //variables
    this.model = undefined;
    this.serverGroups = undefined;
    this.nicMappings = undefined;
    this.serverRoles = [];
    this.selectedAvailableServersRows = [];
    this.selectedAssignedServersRows = [];
    this.clearAvailableServerSelections = false;
    this.clearAssignedServerSelections = false;
    this.selectedModelName = this.props.selectedModelName;
    this.checkInputKeys = [
      'ilo-ip',
      'ilo-user',
      'ilo-password',
      'nic-mapping',
      'server-group'
    ];
    this.rawServerData = undefined;

    //states changes will rerender UI
    this.state = {
      displayAvailableServers: [],
      displayAssignedServers: [],
      selectedServerRole:'',
      availableServersTransferOn: false, //=theTarget.getReactDOM()>  go with selections..TODO need check max reached
      assignedServersTransferOn: false, //<=
      searchFilterText: '',
      pageValid: false,
      //dealing wih context menu
      showAvailableContextMenu: false,
      showAssignedContextMenu: false,
      showEditDetails: false,
      showDetails: false,
      activeRowData: undefined,
      contextMenuLocation: undefined
    };

    this.handleDiscovery = this.handleDiscovery.bind(this);
    this.handleAssignServer = this.handleAssignServer.bind(this);
    this.handleUnAssignServer = this.handleUnAssignServer.bind(this);
    this.handleSearchText = this.handleSearchText.bind(this);
    this.handleRoleSelect = this.handleRoleSelect.bind(this);
    this.handleAvailableServerRowSelect = this.handleAvailableServerRowSelect.bind(this);
    this.handleAssignedServerRowSelect = this.handleAssignedServerRowSelect.bind(this);

    this.handleAvailableServerShowMenu = this.handleAvailableServerShowMenu.bind(this);
    this.handleAssignedServerShowMenu = this.handleAssignedServerShowMenu.bind(this);
    this.handleAssignedServerShowEdit = this.handleAssignedServerShowEdit.bind(this);
    this.handleShowDetail = this.handleShowDetail.bind(this);
    this.handleEditDetailCancel = this.handleEditDetailCancel.bind(this);
    this.handleEditDetailDone = this.handleEditDetailDone.bind(this);
  }

  refreshServers(rawServerData) {
    this.setState({
      displayAssignedServers: [],
      displayAvailableServers: [],
      availableServersTransferOn: false,
      assignedServersTransferOn: false,
      searchFilterText: ''
    });

    this.selectedAvailableServersRows = [];
    this.selectedAssignedServersRows = [];
    this.clearAvailableServerSelections = true;
    this.clearAssignedServerSelections = true;

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
    //keep the json one for now in case can not access microfocus vpn
    //fetch('http://localhost:8080/availableServers')
    //TODO remove
    console.log('start getting available servers data');
    return (
      fetch('http://localhost:8081/api/v1/sm/servers')
        .then(response => response.json())
    );
  }

  handleDiscovery() {
    this.getAvailableServersData()
      .then((rawServerData) => {
        //TODO remove
        console.log('Successfully got available servers data');
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
              console.log('Failed to get all servers details data');
              console.error(JSON.stringify(error));
            });
        }
        else {
          //don't have servers
          //TODO remove
          console.log('Empty available servers data');
        }
      })
      .catch((error) => {
        //TODO remove
        console.error('Failed to get available data');
        console.error(JSON.stringify(error));
      });
  }

  //assign selected servers to server role
  handleAssignServer() {
    let selectedSvrRole = this.state.selectedServerRole;
    let serverRole = this.serverRoles.find((role) => {
      return (selectedSvrRole === role.serverRole);
    });
    if(serverRole) {
      let selAvailableSvrs = this.selectedAvailableServersRows;
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
        assignedServersTransferOn: false,
        availableServersTransferOn: false,
        searchFilterText: ''
      });

      this.selectedAvailableServersRows = [];
      this.selectedAssignedServersRows = [];
      this.clearAvailableServerSelections = true;
      this.clearAssignedServerSelections = true;

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
      let selAssignedSvrs = this.selectedAssignedServersRows;
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
        assignedServersTransferOn: false,
        availableServersTransferOn: false,
        searchFilterText: ''
      });

      this.selectedAvailableServersRows = [];
      this.selectedAssignedServersRows = [];
      this.clearAvailableServerSelections = true;
      this.clearAssignedServerSelections = true;

      //check if we meet the model object server role
      //min requirements
      this.validateServerRoleAssignment();
    }
  }

  //TODO handle selectAll

  //handle click single row on available servers
  handleAvailableServerRowSelect(isChecked, row) {
    if(isChecked) {
      this.setState({availableServersTransferOn: true});
      this.selectedAvailableServersRows.push(row);
    }
    else {
      let idx =
        this.selectedAvailableServersRows.findIndex((aRow) => {
          return row.id === aRow.id;
        });

      if(idx !== -1) {
        this.selectedAvailableServersRows.splice(idx, 1);
        if(this.selectedAvailableServersRows.length === 0) {
          this.setState({availableServersTransferOn: false});
        }
      }
    }
    //let check to be checked
    this.clearAvailableServerSelections = false;
  }

  //handle click single row on assigned servers
  handleAssignedServerRowSelect(isChecked, row) {
    if(isChecked) {
      this.setState({assignedServersTransferOn: true});
      this.selectedAssignedServersRows.push(row);
    }
    else {
      let idx =
        this.selectedAssignedServersRows.findIndex((aRow) => {
          return row.id === aRow.id;
        });

      if(idx !== -1) {
        this.selectedAssignedServersRows.splice(idx, 1);
        if(this.selectedAssignedServersRows.length === 0) {
          this.setState({assignedServersTransferOn: false});
        }
      }
    }
    //let check to be checked
    this.clearAssignedServerSelections = false;
  }

  //handle change role dropdown
  handleRoleSelect(roleName) {
    //find servers in the this.state.serverRoles
    let roles = this.serverRoles;
    let servers = [];
    let findRole = roles.find((role) => {
      return role.serverRole === roleName;
    });

    if(findRole) {
      servers = findRole.servers;
      if(servers) {
        this.setState({displayAssignedServers: servers});
      }
    }
    this.setState({selectedServerRole: roleName});
  }

  //handle filter text change
  handleSearchText(filterText) {
    this.setState({
      searchFilterText: filterText,
      availableServersTransferOn: false
    });
    this.selectedAvailableServersRows = [];
    this.clearAvailableServerSelections = true;
  }

  //handle menu clicks
  handleAvailableServerShowMenu(e, rowData) {
    let tempData = {};
    Object.assign(tempData, rowData);
    this.setState({
      showAvailableContextMenu: true,
      activeRowData: tempData,
      contextMenuLocation: {x : e.pageX, y: e.pageY}
    });
  }

  handleAssignedServerShowMenu(e, rowData) {
    let tempData = {};
    Object.assign(tempData, rowData);
    tempData.role = this.state.selectedServerRole;
    this.setState({
      showAssignedContextMenu: true,
      activeRowData: tempData,
      contextMenuLocation: {x : e.pageX, y: e.pageY}
    }
    );
  }

  handleAssignedServerShowEdit() {
    this.setState({
      showEditDetails: true,
      showAssignedContextMenu: false
    });
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
      availableServersTransferOn: false,
      assignedServersTransferOn: false,
      activeRowData: undefined
    });
    //in case there are something selected
    this.clearAvailableServerSelections = true;
    this.clearAssignedServerSelections = true;
    this.selectedAvailableServersRows = [];
    this.selectedAssignedServersRows = [];

    this.validateServerRoleAssignment();
  }

  handleEditDetailCancel(editData) {
    this.setState({
      showEditDetails: false,
      activeRowData: undefined,
      availableServersTransferOn: false,
      assignedServersTransferOn: false
    });
    //in case there are something selected
    this.clearAvailableServerSelections = true;
    this.clearAssignedServerSelections = true;
    this.selectedAvailableServersRows = [];
    this.selectedAssignedServersRows = [];

    this.validateServerRoleAssignment();
  }

  //get model object before render UI
  componentWillMount() {
    this.getModelObjectData()
      .then((modelData) => {
        //TODO remove
        console.log('Successfully got model object data');
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
          'memberCount': res['min-count'] || 0,
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
      let allRoles = rs_roles.concat(cl_roles);
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
        selectedServerRole: allRoles[displayIdx].serverRole, //TODO what should be default
        displayAssignedServers: displayAssignedSrv,
        displayAvailableServers: displayAvailableSrv
      });
    }
  }

  //prototype query SUMA for details
  getOneServerDetailData(url) {
    let promise = new Promise((resolve, reject) => {
      //TODO remove
      console.log('Start getting one server details data');
      console.log(url);
      fetch(url)
        .then(response => response.json())
        .then((responseData) => {
          //TODO remove
          console.log('Successfully got one server details data');
          resolve(responseData);
        })
        .catch(error => {
          //TODO handle error
          //reject(error);
          //TODO remove
          console.error('Failed to get one server details data');
        });
    });
    return promise;
  }

  //prototype issue queries to SUMA for all the details
  getAllServerDetailsData(serverIds) {
    //TODO remove
    console.log('Start getting all servers details data');

    let promises = [];
    serverIds.forEach((id) => {
      //TODO make it constant
      let url = 'http://localhost:8081/api/v1/sm/servers/' + id;
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
    //TODO remove
    console.log('Start getting model object data');
    return (
      fetch('http://localhost:8081/api/v1/clm/model')
        .then(response => response.json())
    );
  }

  //save the updated model object
  saveModelObjectData() {
    let modl = this.model;
    //TODO remove
    console.log('Start saving model object data');
    return (
      fetch('http://localhost:8081/api/v1/clm/model', {
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
    let moreThanMax = false;
    this.serverRoles.forEach((role) => {
      let reqSize =  role.memberCount;
      let svrSize = role.servers.length;
      if (svrSize !== reqSize && reqSize !== 0) {
        valid = false;
        if (svrSize > reqSize) {
          moreThanMax = true; //TODO need to turn off arrows
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
      if (moreThanMax) {
        //TODO message
      }
      //TODO message
      this.setState({pageValid: false});

      //TODO remove this
      console.error('server role assignment is not valid');
    }
    else {
      //TODO message
      this.setState({pageValid: true});
      //TODO remove this
      console.log('server role assignment is valid');
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
          console.log('Failed to save model object data');
          console.error(JSON.stringify(response));
          this.props.next(true);
        }
        else {
          //go to next page when move this to goForward
          this.props.next(false);
          //TODO remove
          console.log('Sucessfully saved model object data');
        }
      })
      .catch((error) => {
        //TODO handle error
        this.props.next(true); //set error
        //TODO remove
        console.log('Failed to save model object data');
        console.error(JSON.stringify(error));
      });
  }

  //save model updates before move to next page
  goForward(e) {
    e.preventDefault();
    this.doSave();
  }

  renderContextMenu(refType) {
    let menuItems  =  [{
      key: 'context.menu.item.detail',
      callback: this.handleShowDetail,
      show: true
    }, {
      key: 'context.menu.item.edit',
      callback: this.handleAssignedServerShowEdit,
      show: refType === 'availableMenuRef' ? false : true
    }];

    let context = <div></div>;
    if(refType === 'availableMenuRef') {
      context =
        <ContextMenu
          refType={refType}
          show={this.state.showAvailableContextMenu}
          location={this.state.contextMenuLocation}
          data={this.state.activeRowData} items={menuItems}>
        </ContextMenu>
    }
    else {
      context =
        <ContextMenu
          refType={refType}
          show={this.state.showAssignedContextMenu}
          location={this.state.contextMenuLocation}
          data={this.state.activeRowData} items={menuItems}>
        </ContextMenu>
    }
    return context;
  }

  renderAssignUnassignButtons() {
    return (
      <div className="assign-arrows-container">
        <div>
          <AssignButton
            clickAction={this.handleAssignServer}
            isDisabled={!this.state.availableServersTransferOn}/>
        </div>
        <div>
          <UnAssignButton
            clickAction={this.handleUnAssignServer}
            isDisabled={!this.state.assignedServersTransferOn}/>
        </div>
      </div>
    );
  }

  renderServerRoleContent() {
    //server list without details
    let displayAvailableServers = this.state.displayAvailableServers;
    let clearAvailCheckBox = this.clearAvailableServerSelections;
    let clearAssignCheckBox = this.clearAssignedServerSelections;
    let selectedRoleName = this.state.selectedServerRole;

    //display the assigned servers based on role selection
    let displayAssignedServers = this.state.displayAssignedServers;
    //role selection
    let roles = this.serverRoles;

    //apply filter here
    let filterText = this.state.searchFilterText;
    let filteredAvailableServers =
      displayAvailableServers.filter((server) => {
        return (server.name.indexOf(filterText) !== -1);
      });

    let discoverLabel = translate('assign.server.role.discover');
    let availableServersHeading = translate('assign.server.role.available-server');
    let targetServerRoleHeading = translate('assign.server.role.target-server-role');


    return (
      <div id='AssignServerRolePageId' className='wizardContentPage'>
        {this.renderHeading(translate('assign.server.role.heading', this.selectedModelName))}
        <div className='assign-server-role'>
          <div className="server-container">
            <div className="heading">{availableServersHeading}</div>
            <SearchBar
              filterText={this.state.searchFilterText}
              filterAction={this.handleSearchText}>
            </SearchBar>
            <div className="server-list-container">
              <ServerList
                ref='available' data={filteredAvailableServers}
                clearSelections={clearAvailCheckBox} onSelectRow={this.handleAvailableServerRowSelect}
                clickMenuAction={this.handleAvailableServerShowMenu}>
              </ServerList>
              {this.renderContextMenu('availableMenuRef')}
            </div>
          </div>
          {this.renderAssignUnassignButtons()}
          <div className="server-container">
            <div className="heading">{targetServerRoleHeading}</div>
            <ServerRolesDropDown
              serverRoles={roles} selectedServerRole={selectedRoleName}
              selectAction={this.handleRoleSelect}>
            </ServerRolesDropDown>
            <div ref='assign' id='AssignServerRoleId' className="server-list-container">
              <ServerList
                data={displayAssignedServers} checkKeys={this.checkInputKeys}
                clearSelections={clearAssignCheckBox} onSelectRow={this.handleAssignedServerRowSelect}
                clickMenuAction={this.handleAssignedServerShowMenu}>
              </ServerList>
              {this.renderContextMenu('assignMenuRef')}
            </div>
          </div>
          <div>
            <ActionButton clickAction={this.handleDiscovery} displayLabel={discoverLabel}/>
          </div>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }

  renderEditServerDetailContent() {
    return (
      <EditServerDetails
        doneAction={this.handleEditDetailDone}
        cancelAction={this.handleEditDetailCancel}
        serverGroups={this.serverGroups}
        nicMappings={this.nicMappings}
        editData={this.state.activeRowData}>
      </EditServerDetails>
    );
  }

  render() {
    if(this.state.showEditDetails) {
      return this.renderEditServerDetailContent();
    }
    else {
      return this.renderServerRoleContent();
    }
  }
}

class ServerRolesDropDown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedName: this.props.selectedServerRole
    };
    this.handleRoleSelect = this.handleRoleSelect.bind(this);
  }

  renderOptions() {
    let options = this.props.serverRoles.map((role) => {
      let optionDisplay =
        role.name + ' (' + role.serverRole + ' ' + role.servers.length + '/' + role.memberCount + ')';
      return <option key={role.name} value={role.serverRole}>{optionDisplay}</option>;
    });

    return options;
  }

  componentWillReceiveProps(newProps) {
    this.setState({selectedName : newProps.selectedServerRole});
  }

  handleRoleSelect(e) {
    this.setState({selectedName: e.target.value});
    this.props.selectAction(e.target.value);
  }

  render() {
    return (
      <div className="roles-select">
        <select
          value={this.state.selectedName}
          type="select" onChange={this.handleRoleSelect}>
          {this.renderOptions()}
        </select>
      </div>
    );
  }
}

class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.handleFilterTextInputChange = this.handleFilterTextInputChange.bind(this);
  }

  handleFilterTextInputChange(e) {
    e.preventDefault();
    this.props.filterAction(e.target.value);
  }

  render() {
    let searchPlaceholder = translate('placeholder.search.server.text');
    return (
      <div className='search-container'>
        <span className='search-bar'>
          <input
            type="text" placeholder={searchPlaceholder}
            value={this.props.filterText} onChange={this.handleFilterTextInputChange}/>
        </span>
        <span className='glyphicon glyphicon-search search-icon'></span>
      </div>
    );
  }
}

class ServerList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      serverList: this.props.data
    };
    this.handleSelectRow = this.handleSelectRow.bind(this);
    this.handleShowMenu = this.handleShowMenu.bind(this);
  }

  componentWillReceiveProps(newProps) {
    this.setState({serverList : newProps.data});
  }

  handleSelectRow(e, rowData) {
    let isChecked = e.target.checked;
    this.props.onSelectRow(isChecked, rowData);
  }

  handleShowMenu(e, rowData) {
    this.props.clickMenuAction(e, rowData);
  }

  renderServerList(list) {
    let servers = [];
    let toClear = this.props.clearSelections;
    let checkKeys = this.props.checkKeys;
    let handleRowFunc = this.handleSelectRow;
    let handleMenuFunc = this.handleShowMenu;
    list.forEach((server, idx) => {
      let item = undefined;
      if(checkKeys) {
        let requiredUpdate = false;
        let input = checkKeys.find((key) => {
          return (server[key] === undefined || server[key] === '');
        });
        if(input) {
          requiredUpdate = true;
        }
        item =
          <ServerItem
            key={idx} requiredUpdate={requiredUpdate}
            serverItem={server} clearSelection={toClear}
            clickMenuAction={(e) => handleMenuFunc(e, server)}
            changeAction={(e) => handleRowFunc(e, server)}>
          </ServerItem>;
      }
      else {
        item =
          <ServerItem
            key={idx} serverItem={server} clearSelection={toClear}
            clickMenuAction={(e) => handleMenuFunc(e, server)}
            changeAction={(e) => handleRowFunc(e, server)}>
          </ServerItem>;
      }
      servers.push(item);
    });
    return servers;
  }

  render() {
    let serverList = this.state.serverList;
    return (
      <div className="server-list">
        {this.renderServerList(serverList)}
      </div>
    );
  }
}

class ServerItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: false,
      requiredUpdate: false
    };
    this.handleCheckBoxChange = this.handleCheckBoxChange.bind(this);
    this.handleClickMenu = this.handleClickMenu.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if(newProps.clearSelection === true) {
      this.setState({
        checked : false});
    }
    this.setState({requiredUpdate: newProps.requiredUpdate});
  }

  handleCheckBoxChange(e, rowData) {
    this.props.changeAction(e, rowData);
    this.setState({checked: e.target.checked});
  }

  handleClickMenu(e, rowData) {
    this.props.clickMenuAction(e, rowData);
  }

  render() {
    //only have multi select now
    let data = this.props.serverItem;
    let displayName = data.name;
    let itemValue = data.name;
    let moreClass = 'item-menu';
    let cName = 'server-check-box ';
    cName = cName + (this.props.requiredUpdate ? 'required-update' : '');
    return (
      <div className={cName}>
        <input
          type='checkbox' value={itemValue}
          checked={this.state.checked}
          onChange={(e) => this.handleCheckBoxChange(e, data)}/> {displayName}
        <ItemMenuButton
          className={moreClass} clickAction={(e) => this.handleClickMenu(e, data)}/>
      </div>
    );
  }
}

export default AssignServerRoles;
