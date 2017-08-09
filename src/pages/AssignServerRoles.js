import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import { ActionButton, AssignButton, UnAssignButton } from '../components/Buttons.js';
import { LoadingMask } from '../components/LoadingMask.js';
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
      availableServersHasSelect: false, //used to change right arrow
      assignedServersHasSelect: false, //used to change left arrow
      isAssignedServerMax: false, //TODO used to turn off right arrow
      searchFilterText: '',
      serverDetails: [],
      clearAvServerItemSelections: false,
      clearAsServerItemSelections: false,
      selectedModelName: this.props.selectedModelName
    };

    this.handleGetAvailableServers = this.handleGetAvailableServers.bind(this);
    this.handleAssignServer = this.handleAssignServer.bind(this);
    this.handleUnAssignServer = this.handleUnAssignServer.bind(this);
    this.handleSearchText = this.handleSearchText.bind(this);
    this.handleRoleSelect = this.handleRoleSelect.bind(this);
    this.handleAvailableServerRowSelect = this. handleAvailableServerRowSelect.bind(this);
    this.handleAssignedServerRowSelect = this. handleAssignedServerRowSelect.bind(this);
    this.updateModelWithServerRoles = this.updateModelWithServerRoles.bind(this);
    this.saveModelObjectData = this.saveModelObjectData.bind(this);
  }

  refreshServers(responseData) {
    this.setState({availableServers: responseData});
    this.setState({displayAssignedServers: []});
    this.setState({availableServersHasSelect: false});
    this.setState({assignedServersHasSelect: false});
    this.setState({isAssignedServerMax: false});
    this.setState({selectedAvailableServersRows: []});
    this.setState({selectedAssignedServersRows: []});
    this.setState({searchFilterText: ''});
    this.state.serverRoles.forEach(function(role){
      //clean up servers
      role.servers = [];
    });
    this.setState({selectedServerRole: this.state.serverRoles[0].name});

    //need to clean the selections after assign and unassign
    this.setState({clearAvServerItemSelections: true});
    this.setState({clearAsServerItemSelections: true});
    this.getServerRoles();
  }

  handleGetAvailableServers() {
    //keep the json one for now in case can not access microfocus vpn
    //fetch('http://localhost:8080/availableServers')
    fetch('http://localhost:8081/api/v1/sm/servers')
      .then(response => response.json())
      .then((responseData) => {
        this.refreshServers(responseData);
      })
      .catch(error => {
        //TODO handle error
      });
  }

  //assign selected servers to server role
  handleAssignServer() {
    let selectedSvrRole = this.state.selectedServerRole;
    let serverRole = this.state.serverRoles.find(function(role) {
      return ( selectedSvrRole === role.name)
    });
    if(serverRole) {
      let selectedAvServers = this.state.selectedAvailableServersRows;
      let assignedServers = serverRole.servers;
      //TODO need to check if it is already there
      //when deal with save state later
      serverRole.servers = assignedServers.concat(selectedAvServers);

      //update the assigned servers table
      this.setState({displayAssignedServers: serverRole.servers });

      //remove them from availableServers
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

      //update available servers
      this.setState({availableServers: avServers});

      //clean up selected rows
      this.state.selectedAvailableServersRows = [];
      this.state.selectedAssignedServersRows = [];

      //turn off the arrows buttons
      this.setState({assignedServersHasSelect: false});
      this.setState({availableServersHasSelect: false});


      //clean up checked mark both side
      this.setState({clearAvServerItemSelections: true});
      this.setState({clearAsServerItemSelections: true});
      //clear search text
      this.setState({searchFilterText: ''});

      //check if we meet the model object server role
      //min requirements
      this.validateServerRoleAssignment(serverRole);
    }
  }

  //unassign selected servers from server role
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

      //remove from assigned servers
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

      //clean up the selected rows
      this.state.selectedAssignedServersRows = [];
      this.state.selectedAssignedServersRows = [];
      //turn off the arrows buttons
      this.setState({assignedServersHasSelect: false});
      this.setState({availableServersHasSelect: false});

      //clean up checked mark both side
      this.setState({clearAvServerItemSelections: true});
      this.setState({clearAsServerItemSelections: true});
      //clear search text
      this.setState({searchFilterText: ''});

      //check if we meet the model object server role
      //min requirements
      this.validateServerRoleAssignment(serverRole);
    }
  }

  //TODO handle selectAll

  //handle click single row on available servers
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
    this.state.clearAvServerItemSelections = false;
  }

  //handle click single row on assigned servers
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
    this.state.clearAsServerItemSelections = false;
  }

  //handle change role dropdown
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

  //handle filter text change
  handleSearchText(filterText) {
    this.setState({searchFilterText: filterText});
    this.setState({clearAvServerItemSelections: true});
    this.state.selectedAvailableServersRows = [];
    //turn off right arrow
    this.setState({availableServersHasSelect: false});
  }

  //get model object before render UI
  componentWillMount() {
    this.getModelObjectData()
  }

  //process model to get server roles information
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
          'memberCount': res['min-count'] ? res['min-count'] : 0,
          'servers': [], //add display server rows
          'serverRole': res['server-role'],
          'group': 'resources'
        };
        return rs_role;
      });
      let cl_roles = clusters.map(function(res) {
        let rs_role = {
          'name': res.name,
          'memberCount': res['member-count'] ? res['member-count'] : 0,
          'serverRole': res['server-role'],
          'servers': [], //add display server rows
          'group': 'clusters'
        };

        return rs_role;
      });

      this.setState({serverRoles: rs_roles.concat(cl_roles)})
        .then(() => {
          //default to set the first in the array
          //TODO what is the default
          this.setState({selectedServerRole: this.state.serverRoles[0].name});
        });
    }
  }

  //query SUMA for details
  getOneServerDetailData(url) {
    let promise = new Promise(function(resolve, reject) {
      fetch(url)
        .then(response => response.json())
        .then((responseData) => {
          resolve(responseData);
        })
        .catch(error => {
          //TODO handle error
          //reject(error);
        });
    });
    return promise;
  }

  //issue queries to SUMA for all the details
  getAllServerDetailsData() {
    let roles = this.state.serverRoles;

    let serverIds = [];
    roles.forEach(function(role) {
      let svrs = role.servers;
      let ids = svrs.map(function(svr) {
        return svr.id;
      });
      if(ids.length > 0) {
        serverIds = serverIds.concat(ids);
      }
    });

    let promises = [];
    let requestDetailFunc = this.getOneServerDetailData;
    serverIds.forEach(function(id) {
      //TODO make it constant
      let url = 'http://localhost:8081/api/v1/sm/servers/' + id;
      promises.push(requestDetailFunc(url))
    });

    return Promise.all(promises);
  }

  //update the model servers based on
  //server role assginment
  updateModelWithServerRoles(details) {
    let serverRoles = this.state.serverRoles;
    let modelObject = this.state.model;

    serverRoles.forEach(function(role) {
      //TODO experimental
      let modelServers = modelObject.inputModel.servers;
      let servers = role.servers;
      let roleId = role.serverRole;

      if (servers && servers.length > 0) {
        //TODO this just prototype we can update model
        //far from done...need more work for missing data part
        //NO checking existing servers
        let matchModelServersForRole = modelServers.filter(function(modelServer) {
          return (modelServer.role === roleId);
        });
        if(matchModelServersForRole && matchModelServersForRole.length > 0) {
          //go through server in each role
          servers.forEach(function (svr, idx) {
            let sDetail = details.find(function (detail) {
              return detail.id === svr.id;
            });
            let id = svr.id;
            //get ip from detail TODO
            let nkdevice = sDetail.network_devices.find(function (device) {
              return device.interface === 'eth0';
            });
            //what if there is no 'eth0'??
            let ip = nkdevice.ip;
            //update model...not much to do here TODO mic-mapping???
            //experimental
            if (role.memberCount > 0) {
              matchModelServersForRole[idx].id = id;
              matchModelServersForRole[idx]['ip-addr'] = ip;
            }
            else { //no required number like compute
              //TODO experimental, need better logic
              if (idx > (matchModelServersForRole.length - 1)) {
                //add new one
                matchModelServersForRole.push({
                  'id': id,
                  'role': roleId,
                  'ip-addr': ip
                })
              }
              else { //updata existing one
                matchModelServersForRole[idx].id = id;
                matchModelServersForRole[idx]['ip-addr'] = ip;
              }
            }
          });
        }
      }
    });
  }

  saveCurrentState() {
    //TODO
    //if we saved state...need to deal with existing and rediscovery
  }

  //query the model object from ardana
  getModelObjectData() {
    fetch('http://localhost:8081/api/v1/clm/model')
      .then(response => response.json())
      .then((responseData) => {
        this.state.model = responseData;
        this.getServerRoles();
      });
    //TODO handle error
  }

  //save the updated model object
  saveModelObjectData() {
    let modl = this.state.model;
    let promise = new Promise(function(resolve, reject) {
      fetch('http://localhost:8081/api/v1/clm/model', {
        method: "POST",
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(modl)
      })
        .then(response => {
          resolve(response);
          //TODO log something
        })
        .catch(error => {
          //TODO log error
          reject(error);
        });
    });
    return promise;
  }

  //check if we have enough servers roles for the model
  validateServerRoleAssignment(currentRole) {
    let valid = true;
    let moreThanMax = false;
    this.state.serverRoles.forEach(function(role) {
      let reqSize =  role.memberCount;
      //TODO we don't have enough servers to test...for now
      //only check controller role
      let svrSize = role.servers.length;
      if (svrSize !=  reqSize && reqSize !== 0) {
        valid = false;
        if (svrSize > reqSize) {
          moreThanMax = true;
        }
      }
    });
    if (!valid) {
      //TODO need to disable Next
      if (moreThanMax) {
        //TODO message if size > reqSize
      }

    }
    else {
      //TODO need to enable Next
      //message
    }
  }

  //save model updates before move to next page
  goForward(e) {
    e.preventDefault();

    let updateModelFunc = this.updateModelWithServerRoles;
    let nextFunc = this.props.next;
    let saveModel = this.saveModelObjectData;
    this.getAllServerDetailsData().then(
      function(details) {
        updateModelFunc(details);
        //save model and move to next page
        saveModel()
          .then(responseData => {
            //go to next page
            nextFunc(false);
          })
          .catch(error => {
            //TODO handle error
            nextFunc(true);
            //TODO turn off next
          });
      },
      function(error) {
        //TODO handle error
        nextFunc(true);
        //TODO turn off next
      });
  }

  render() {
    //server list without details
    let availableServers = this.state.availableServers;
    let clearAvCheckBox = this.state.clearAvServerItemSelections;
    let clearAsCheckBox = this.state.clearAsServerItemSelections;
    let modelName = this.state.selectedModelName;

    //display the assigned servers based on role selection
    let displayAssignedServers = this.state.displayAssignedServers;
    //role selection
    let roles = this.state.serverRoles;

    //apply filter here
    let filterText = this.state.searchFilterText;
    let filteredAvailableServers = availableServers.filter(function (server) {
      return (server.name.indexOf(filterText) !== -1);
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
                        clearSelections={clearAvCheckBox}
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
                        clearSelections={clearAsCheckBox}
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
        role.name + ' (' + role.serverRole + ' ' + role.servers.length + '/' + role.memberCount + ')';
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
    //only have multi select now
    //TODO global select???
    let data = this.props.serverItem;
    let displayName = data.name;
    let itemValue = data.name;
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