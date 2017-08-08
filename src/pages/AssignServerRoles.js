import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import { ActionButton, AssignButton, UnAssignButton } from '../components/Buttons.js';

import BaseWizardPage from './BaseWizardPage.js';

class AssignServerRoles extends BaseWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      availableServers: [],
      displayAssignedServers: [],
      selectedServerRole:'',
      serverRoles: [],
      model: undefined,
      selectedAvailableServersRows: [],
      selectedAssignedServersRows: [],
      availableServersHasSelect: false, //used for change right arrow
      assignedServersHasSelect: false, //used for change left arrow
      searchFilterText: '',
      serverDetails: [],
      clearServerItemSelections: false,
      selectedModelName: this.props.selectedModelName
    };

    this.handleGetAvailableServers = this.handleGetAvailableServers.bind(this);
    this.handleAssignServer = this.handleAssignServer.bind(this);
    this.handleUnAssignServer = this.handleUnAssignServer.bind(this);
    this.handleSearchText = this.handleSearchText.bind(this);
    this.handleRoleSelect = this.handleRoleSelect.bind(this);
    this.handleAvailableServerRowSelect = this. handleAvailableServerRowSelect.bind(this);
    this.handleAssignedServerRowSelect = this. handleAssignedServerRowSelect.bind(this);
  }

  refreshServers(responseData) {
    this.setState({availableServers: responseData});
    this.setState({displayAssignedServers: []});
    this.setState({availableServersHasSelect: false});
    this.setState({assignedServersHasSelect: false});
    this.setState({selectedAvailableServersRows: []});
    this.setState({selectedAssignedServersRows: []});
    this.setState({searchFilterText: ''});
    this.state.serverRoles.forEach(function(role){
      //clean up servers
      role.servers = [];
    });
    this.setState({selectedServerRole: this.state.serverRoles[0].name});
    this.state.serverDetails = [];
    //need to clean the selections after assign and unassign
    this.setState({clearServerItemSelections: true});
  }

  handleGetAvailableServers() {
    //keep the json one for now in case can not access microfocus vpn
    //fetch('http://localhost:8080/availableServers')
    fetch('http://localhost:8081/api/v1/sm/servers')
      .then(response => response.json())
      .then((responseData) => {
        this.refreshServers(responseData);
      });
    //TODO handle error
  }

  handleAssignServer() {
    let selectedSvrRole = this.state.selectedServerRole;
    let serverRole = this.state.serverRoles.find(function(role) {
      return ( selectedSvrRole === role.name)
    });
    if(serverRole) {
      let selectedAvServers = this.state.selectedAvailableServersRows;
      let assignedServers = serverRole.servers;
      //TODO need to check if it is already there
      serverRole.servers = assignedServers.concat(selectedAvServers);

      //update the assigned servers table
      this.setState({displayAssignedServers: serverRole.servers });
      this.state.selectedAvailableServersRows = [];

      //turn off the right arrow button
      this.setState({availableServersHasSelect : false});

      //remove them from availableServers table
      let avServers = [];
      Object.assign(avServers, this.state.availableServers);
      selectedAvServers.forEach(function(server) {
        let idx = -1;
        idx = avServers.findIndex(function(aServer) {
          return aServer.id === server.id;
        });

        if(idx !== -1) {
          avServers.splice(idx, 1);
        }
      });
      //update available servers table
      this.setState({availableServers: avServers});
      //clean up checked mark
      this.setState({clearServerItemSelections: true});
    }
  }

  handleUnAssignServer() {
    let selectedSvrRole = this.state.selectedServerRole;
    let serverRole = this.state.serverRoles.find(function(role) {
      return ( selectedSvrRole === role.name)
    });

    if(serverRole) {
      let selectedAsServers = this.state.selectedAssignedServersRows;
      let avServers = this.state.availableServers;

      //update available servers
      this.setState({availableServers: avServers.concat(selectedAsServers)});

      let asServers = serverRole.servers;
      selectedAsServers.forEach(function(server) {
        let idx = -1;
        idx = asServers.findIndex(function(asServer) {
          return asServer.id === server.id;
        });
        if(idx !== -1) {
          asServers.splice(idx, 1);
        }
      });
      //update assigned servers table
      let displayAsServers = [];
      Object.assign(displayAsServers, asServers);
      this.setState({displayAssignedServers: displayAsServers});

      //turn off the left arrow button
      this.setState({assignedServersHasSelect: false});

      this.state.selectedAssignedServersRows = [];
      this.setState({clearServerItemSelections: true});
      //need to update the dropdown TODO???
    }
  }

  //handle click single row on available servers table
  handleAvailableServerRowSelect(isChecked, row) {
    if(isChecked) {
      this.setState({availableServersHasSelect: true});
      this.state.selectedAvailableServersRows.push(row);
    }
    else {
      let idx =
        this.state.selectedAvailableServersRows.findIndex(function(aRow) {
        return row.id === aRow.id;
      });

      if(idx !== -1) {
        this.state.selectedAvailableServersRows.splice(idx, 1);
        if(this.state.selectedAvailableServersRows.length === 0) {
          this.setState({availableServersHasSelect: false});
        }
      }
    }
    //let check to be checked
    this.state.clearServerItemSelections = false;
  }

  //handle click single row on assigned servers table
  handleAssignedServerRowSelect(isChecked, row) {
    if(isChecked) {
      this.setState({assignedServersHasSelect: true});
      this.state.selectedAssignedServersRows.push(row);
    }
    else {
      let idx =
        this.state.selectedAssignedServersRows.findIndex(function(aRow) {
          return row.id === aRow.id;
        });

      if(idx !== -1) {
        this.state.selectedAssignedServersRows.splice(idx, 1);
        if(this.state.selectedAssignedServersRows.length === 0) {
          this.setState({assignedServersHasSelect: false});
        }
      }
    }
    //let check to be checked
    this.state.clearServerItemSelections = false;
  }

  handleRoleSelect(roleName) {
    //find servers in the this.state.serverRoles
    let roles = this.state.serverRoles;
    let servers = [];
    let findRole = roles.find(function(role) {
      return role.name === roleName;
    });

    if(findRole) {
      servers = findRole.servers;
      if(servers) {
        this.setState({displayAssignedServers: servers});
      }
    }
    this.setState({selectedServerRole: roleName});
  }

  handleSearchText(filterText) {
    this.setState({
      searchFilterText: filterText
    });
  }

  componentWillMount() {
    this.getModelObject()
  }

  getServerRoles() {
    //process this.state.model and get the list of server roles
    //from resources and clusters
    //only pick one control plane for now...
    //could have multiple control planes in the future
    let cpData = this.state.model['inputModel']['control-planes'][0];
    //TODO some error handling
    //this assume a fresh start.
    //need to deal with preserved state
    if(cpData) {
      let resources = cpData.resources;
      let clusters = cpData.clusters;
      let rs_roles = resources.map(function(res) {
        let rs_role = {
          'name': res.name,
          'memberCount': res['min-count'],
          'servers': [], //add display server rows
          'serverRole': res['server-role'],
          'group': 'resources'
        };
        return rs_role;
      });
      let cl_roles = clusters.map(function(res) {
        let rs_role = {
          'name': res.name,
          'memberCount': res['member-count'], //TODO ??
          'serverRole': res['server-role'],
          'servers': [], //add display server rows
          'group': 'clusters'
        };

        return rs_role;
      });

      this.setState({serverRoles: rs_roles.concat(cl_roles)});
      //default to set the first in the array
      //TODO
      this.state.selectedServerRole = this.state.serverRoles[0].name;
    }
  }

  getServerDetails() {
    let roles = this.state.serverRoles;
    let serverIds = [];
    this.serverRoles.forEach(function(role) {
       let svrs = role.servers;
       let ids = svrs.map(function(svr) {
         return svr.id;
       });
      serverIds.concat(ids);
    });

    let details = [];
    serverIds.forEach(function(id) {
      fetch('http://localhost:8081/api/v1/sm/servers/' + id)
        .then(response => response.json())
        .then((responseData) => {
          details.push(responseData);
        });
      //TODO handle error
    });

    this.state.serverDetails = details;
  }

  findRoleForServer(serverId) {
    this.state.serverRoles.forEach(function(role){
      let servers = role.servers;
      let server = servers.find(function(server) {
        return server.id === serverId;
      });
      if(server) {
        return role;
      }
    });
  }

  updateModelWithServerRoles() {
    this.state.serverDetails.forEach(function(detail) {
      let id = detail.id;
      let nkdevice = detail.network_devices.find(function(device) {
        return device.interface === 'eth0'; //TODO
      });
      let ip = nkdevice.ip;
      let role = this.findRoleForServer(id);
      let roleName = role.serverRole;
    });
  }

  saveCurrentState() {
    //if we saved state...need to deal with existing and rediscovery
  }

  getModelObject() {
    fetch('http://localhost:8081/api/v1/clm/model')
      .then(response => response.json())
      .then((responseData) => {
        this.state.model = responseData;
        this.getServerRoles();
      });
    //TODO handle error
  }

  saveModelObject() {
    fetch('http://localhost:8081/api/v1/clm/model', {
      method: "POST",
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.model)
    });
  }

  render() {
    //server list without details
    //need to make a copy?? TODO
    let availableServers = this.state.availableServers;
    let clearCheckBox = this.state.clearServerItemSelections;
    let modelName = this.state.selectedModelName;

    //display the assigned servers based on role selection
    let displayAssignedServers = this.state.displayAssignedServers;
    //role selection
    let roles = this.state.serverRoles;

    //apply filter here
    let filterText = this.state.searchFilterText;
    let filteredAvailableServers = [];
    availableServers.forEach(function (server) {
      if(server.name.indexOf(filterText) === -1) {
        return;
      }
      filteredAvailableServers.push(server);
    });

    let discoverLabel = translate('assign.server.role.discover');
    let availableServersHeading = translate('assign.server.role.available-server');
    let targetServerRoleHeading = translate('assign.server.role.target-server-role');

    return (
      <div className='wizardContentPage'>
        {this.renderHeading(translate('assign.server.role.heading', modelName))}
        <div className="server-container">
          <div className="heading">{availableServersHeading}</div>
          <SearchBar filterText={this.state.searchFilterText}
                     filterAction={this.handleSearchText}/>
          <div className="server-list-container">
            <ServerList ref='available' data={filteredAvailableServers}
                        clearSelections={clearCheckBox}
                        onSelectRow={this.handleAvailableServerRowSelect}
                        onSelectAll={this.handleAvailableServerSelectAll}></ServerList>
          </div>
        </div>
        <div className="assign-arrows-container">
          <div>
            <AssignButton clickAction={this.handleAssignServer}
                          isDisabled={!this.state.availableServersHasSelect}/>
          </div>
          <div>
            <UnAssignButton clickAction={this.handleUnAssignServer}
                            isDisabled={!this.state.assignedServersHasSelect}/>
          </div>
        </div>
        <div className="server-container">
          <div className="heading">{targetServerRoleHeading}</div>
          <ServerRolesDropDown serverRoles={roles}
                               selectAction={this.handleRoleSelect}></ServerRolesDropDown>
          <div className="server-list-container">
            <ServerList ref='assign' data={displayAssignedServers}
                        clearSelections={clearCheckBox}
                        onSelectRow={this.handleAssignedServerRowSelect}
                        onSelectAll={this.handleAssignedServerSelectAll}></ServerList>
          </div>
        </div>
        <div>
          <ActionButton clickAction={this.handleGetAvailableServers} displayLabel={discoverLabel}/>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

class ServerRolesDropDown extends Component {
  constructor(props) {
    super(props);
    this.renderOptions = this.renderOptions.bind(this);
    this.handleRoleSelect = this.handleRoleSelect.bind(this);
  }

  renderOptions() {
    let options = this.props.serverRoles.map(function(role) {
      let optionDisplay =
        role.name + ' (' + role.servers.length + '/' + role.memberCount + ')';
      return <option key={role.serverRole} value={role.name}>{optionDisplay}</option>
    });

    return options;
  }

  handleRoleSelect(e) {
    e.preventDefault();
    this.props.selectAction(e.target.value);
  }

  render() {
    //TODO have problem change select font-size
    return (
      <div className="roles-select">
        <select type="select" onChange={this.handleRoleSelect}>
          {this.renderOptions()}
        </select>
      </div>
    )
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
    return (
      <div className='search-container'>
        <span className='search-bar'>
          <input type="text" placeholder="search server..."
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
    this.handleSelectRow = this.handleSelectRow.bind(this);
  }

  handleSelectRow(e, rowData) {
    let isChecked = e.target.checked;
    this.props.onSelectRow(isChecked, rowData);
  }

  renderServerList(list) {
    let servers = [];
    let toClear = this.props.clearSelections;
    let handleRowFunc = this.handleSelectRow;
    list.forEach(function(server, idx) {
      let item =
        <ServerItem key={idx} serverItem={server} clearSelection={toClear}
                    changeAction={(e) => handleRowFunc(e, server)}></ServerItem>
      servers.push(item);
    });
    return servers;
  }


  render() {
    let serverList = this.props.data;
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
    this.handleCheckBoxChange = this.handleCheckBoxChange.bind(this);
    this.state = {
      checked: false
    }
  }

  componentWillReceiveProps(newProps) {
    if(newProps.clearSelection === true) {
      this.setState({checked : false});
    }
  }

  handleCheckBoxChange(e, rowData) {
    this.props.changeAction(e, rowData);
    this.setState({checked: e.target.checked});
  }

  render() {
    let data = undefined;
    let itemValue = '';
    let displayName = this.props.name; //if have name it is global selection
    if (displayName) {
      displayName = translate('assign.server.role.' + displayName);
      itemValue = 'globalselect';
    }
    else {
      data = this.props.serverItem;
      displayName = data.name;
      itemValue = data.name;
    }
    return (
      <div className='server-check-box'>
        <input id='serverItemId' type='checkbox' value={itemValue}
               checked={this.state.checked}
               onChange={(e) => this.handleCheckBoxChange(e, data)}/> {displayName}
      </div>
    );
  }
}
export default AssignServerRoles;