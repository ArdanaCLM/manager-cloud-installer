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
    this.selectedModelName = this.props.selectedModelName;
    this.checkInputKeys = [
      'ilo-ip',
      'ilo-user',
      'ilo-password',
      'nic-mapping',
      'server-group'
    ];
    this.activeRowData = undefined;
    this.contextMenuLocation = undefined;

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
      //show the popup menu for available servers
      showAvailableContextMenu: false,
      //show popup menu for assigned servers
      showAssignedContextMenu: false,
      //show edit page when click edit on the popup menu
      showEditDetails: false,
      //show detail page when click details on the popup menu
      showDetails: false
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
      fetch('http://localhost:8081/api/v1/sm/servers')
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
    return (
      fetch('http://localhost:8081/api/v1/clm/model')
        .then(response => response.json())
    );
  }

  //save the updated model object
  saveModelObjectData() {
    let modl = this.model;
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
      context = (
        <ContextMenu
          refType={refType}
          show={this.state.showAvailableContextMenu}
          location={this.contextMenuLocation}
          data={this.activeRowData} items={menuItems}>
        </ContextMenu>
      );
    }
    else {
      context = (
        <ContextMenu
          refType={refType}
          show={this.state.showAssignedContextMenu}
          location={this.contextMenuLocation}
          data={this.activeRowData} items={menuItems}>
        </ContextMenu>
      );
    }
    return context;
  }

  isAssignButtonDisabled() {
    let isDisabled = this.state.selectedAvailableServersRows.length === 0 ;
    return isDisabled;
  }

  isUnAssignButtonDisabled() {
    let isDisabled = this.state.selectedAssignedServersRows.length === 0;
    return isDisabled;
  }

  renderAssignUnassignButtons() {
    return (
      <div className="assign-arrows-container">
        <div>
          <AssignButton
            clickAction={this.handleAssignServer}
            isDisabled={this.isAssignButtonDisabled()}/>
        </div>
        <div>
          <UnAssignButton
            clickAction={this.handleUnAssignServer}
            isDisabled={this.isUnAssignButtonDisabled()}/>
        </div>
      </div>
    );
  }

  renderServerRoleContent() {
    //server list without details
    let displayAvailableServers = this.state.displayAvailableServers;
    let unSelectAvailableSrvRowsAll = this.state.selectedAvailableServersRows.length === 0;
    let unSelectAssignedSrvRowsAll = this.state.selectedAssignedServersRows.length === 0;
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


    return (
      <div id='AssignServerRolePageId' className='wizard-content'>
        {this.renderHeading(translate('assign.server.role.heading', this.selectedModelName))}
        <div className='assign-server-role body-container'>
          <div className="server-container">
            <h4>{translate('assign.server.role.available-server')}</h4>
            <SearchBar
              filterText={this.state.searchFilterText}
              filterAction={this.handleSearchText}>
            </SearchBar>
            <div className="server-list-container rounded-box">
              <ServerList
                ref='available' data={filteredAvailableServers}
                unSelectAll={unSelectAvailableSrvRowsAll} onSelectRow={this.handleAvailableServerRowSelect}
                clickMenuAction={this.handleAvailableServerShowMenu}>
              </ServerList>
              {this.renderContextMenu('availableMenuRef')}
            </div>
          </div>
          {this.renderAssignUnassignButtons()}
          <div className="server-container">
            <h4>{translate('assign.server.role.target-server-role')}</h4>
            <ServerRolesDropDown
              serverRoles={roles} selectedServerRole={selectedRoleName}
              selectAction={this.handleRoleSelect}>
            </ServerRolesDropDown>
            <div ref='assign' id='AssignServerRoleId' className="server-list-container rounded-box">
              <ServerList
                data={displayAssignedServers} checkKeys={this.checkInputKeys}
                unSelectAll={unSelectAssignedSrvRowsAll} onSelectRow={this.handleAssignedServerRowSelect}
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
        editData={this.activeRowData}>
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
      let modelCount = role.minCount !== undefined ? role.minCount : role.memberCount;
      let optionDisplay =
        role.name + ' (' + role.serverRole + ' ' + role.servers.length + '/' + modelCount + ')';
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
        <select className='rounded-box'
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
          <input className='rounded-box'
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
    let checkKeys = this.props.checkKeys;
    let unSelect = this.props.unSelectAll;
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
            serverItem={server} unSelect={unSelect}
            clickMenuAction={(e) => handleMenuFunc(e, server)}
            changeAction={(e) => handleRowFunc(e, server)}>
          </ServerItem>;
      }
      else {
        item =
          <ServerItem
            key={idx} serverItem={server} unSelect={unSelect}
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
    if(newProps.unSelect === true) {
      this.setState({
        checked : false,
        requiredUpdate: newProps.requiredUpdate
      });
    }
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
