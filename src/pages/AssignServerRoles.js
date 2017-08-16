import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import { ActionButton, AssignButton, UnAssignButton } from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';

class AssignServerRoles extends BaseWizardPage {

  constructor(props) {
    super(props);

    //variables
    this.model = undefined;
    this.serverRoles = [];
    this.selectedAvailableServersRows = [];
    this.selectedAssignedServersRows = [];
    this.clearAvailableServerSelections = false;
    this.clearAssignedServerSelections = false;

    //states changes will rerender UI
    this.state = {
      displayAvailableServers: [],
      displayAssignedServers: [],
      selectedServerRole:'',
      availableServersTransferOn: false, //=>  go with selections..TODO need check max reached
      assignedServersTransferOn: false, //<=
      selectedModelName: this.props.selectedModelName,
      searchFilterText: '',
      pageValid: false
    };

    this.handleDiscovery = this.handleDiscovery.bind(this);
    this.handleAssignServer = this.handleAssignServer.bind(this);
    this.handleUnAssignServer = this.handleUnAssignServer.bind(this);
    this.handleSearchText = this.handleSearchText.bind(this);
    this.handleRoleSelect = this.handleRoleSelect.bind(this);
    this.handleAvailableServerRowSelect = this.handleAvailableServerRowSelect.bind(this);
    this.handleAssignedServerRowSelect = this.handleAssignedServerRowSelect.bind(this);
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
    this.getServerRoles(rawServerData);
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
      return (selectedSvrRole === role.name);
    });
    if(serverRole) {
      let selAvailableSvrs = this.selectedAvailableServersRows;
      let assignedServers = serverRole.servers;
      serverRole.servers = assignedServers.concat(selAvailableSvrs);

      //experimental to reduce code
      // let assignedIds = serverRole.servers.map((svr) => {
      //   return svr.id;
      // });
      // let tempAvailableSvrs = this.state.displayAvailableServers.filter((srv) => {
      //   //find on which is not assigned if mixed with string and number...will have problems
      //   return (assignedIds.indexOf(srv.id) === -1);
      // });

      //remove them from availableServers
      let tempAvailableSvrs = [];
      //don't want to change the state value directly,
      //make a copy first, setState later and render UI
      Object.assign(tempAvailableSvrs, this.state.displayAvailableServers);
      //go through each selected servers to find out the exact position of the matching one
      //in tempAvailableSvrs so we can remove correct one in tempAvailableSvrs
      selAvailableSvrs.forEach((server) => {
        let idx = -1;
        idx = tempAvailableSvrs.findIndex((aServer) => {
          return aServer.id === server.id;
        });

        if(idx !== -1) {
          tempAvailableSvrs.splice(idx, 1);
        }
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
      return (selectedSvrRole === role.name);
    });

    if(serverRole) {
      let selAssignedSvrs = this.selectedAssignedServersRows;
      let displayAvailableSvrs = this.state.displayAvailableServers;

      //update available servers)
      this.setState({
        displayAvailableServers: displayAvailableSvrs.concat(selAssignedSvrs)
      });

      //remove from assigned servers

      //experimental to reduce code
      // let selectedIds = selAssignedSvrs.map((svr) => {
      //   return svr.id;
      // });
      //
      // let displayAssignedSvrs = serverRole.servers.filter((svr) => {
      //   //find one which is not selected
      //   ids could be string and number so it has some issues.
      //   return (selectedIds.indexOf(svr.id) === -1)
      // });

      //go through each selected servers to find out exact position of the matching one in
      //tempAssignedSvrs so we can remove it in tempAssignedSvrs
      let tempAssignedSvrs = this.state.displayAssignedServers;
      selAssignedSvrs.forEach((server) => {
        let idx = -1;
        idx = tempAssignedSvrs.findIndex((asServer) => {
          return asServer.id === server.id;
        });
        if(idx !== -1) {
          tempAssignedSvrs.splice(idx, 1);
        }
      });
      //update assigned servers table
      let displayAssignedSvrs = [];
      Object.assign(displayAssignedSvrs, tempAssignedSvrs);
      serverRole.servers = tempAssignedSvrs;
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
    this.setState({
      searchFilterText: filterText,
      availableServersTransferOn: false
    });
    this.selectedAvailableServersRows = [];
    this.clearAvailableServerSelections = true;
  }

  //get available servers and model object before render UI
  componentWillMount() {
    //TODO this is a prototype to get data from servers
    //there will be other page to do the discovery based on what
    //server integration
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
              //TODO remove
              console.log('Successfully got all servers details data');
              rawServerData = this.updateServerDataWithDetails(details);
              this.getModelObjectData()
                .then((modelData) => {
                  //TODO remove
                  console.log('Successfully got model object data');
                  this.model = modelData;
                  this.getServerRoles(rawServerData, modelData);
                  this.validateServerRoleAssignment();
                })
                .catch((error) => {
                  //TODO remove
                  console.error('Failed to get model object data');
                  console.error(JSON.stringify(error));
                });
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
        //not sure why it got in here after successfully got it above
        //TODO remove
        console.error('Failed to get available data');
      });
  }

  updateServerDataWithDetails(details) {
    //details has everything
    let retData = details.map((srvDetail) => {
      let nkdevice = srvDetail.network_devices.find((device) => {
        return device.interface === 'eth0'; //TODO
      });
      //at this point only these are useful
      let serverData = {
        'id': srvDetail.id,
        'name': srvDetail.name,
        'ip-addr': nkdevice.ip,
        'mac-addr': nkdevice['hardware_address']
      };
      return serverData;
    });
    return retData;
  }

  //process model to get server roles information
  getServerRoles(rawAvailableServerData, modelData) {
    //process this.model and get the list of server roles
    //from resources and clusters
    //only pick one control plane for now...
    //could have multiple control planes in the future
    if(!modelData) {
      modelData = this.model;
    }
    else {
      this.model = modelData;
    }

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
            let retValue = {
              'id': srv.id,
              'ip-addr': srv['ip-addr'],
              'name': srv.name ? srv.name : srv.id,
              'mac-address': srv['mac-addr'] || '',
              'role': srv.role || '',
              'server-group': srv['server-group'] || '',
              'ilo-ip': srv['ilo-ip'] || '',
              'ilo-user': srv['ilo-user'] || '',
              'ilo-password': srv['ilo-password'] || '',
              'nic-mapping': srv['nic-mapping'] || ''
            };
            return retValue;
          });
          //record the ids assume id is the same id in
          //discovered available servers
          let retIds = matchedModelSvrs.map((srv) => {
            return srv.id;
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
      if(rawAvailableServerData && rawAvailableServerData.length > 0) {
        displayAvailableSrv = rawAvailableServerData.filter((server) => {
          return (allAssignedSrvIds.indexOf(server.id) === -1);
        });
      }

      this.serverRoles = allRoles;
      this.setState({
        selectedServerRole: allRoles[displayIdx].name, //TODO what should be default
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
            'nic-mapping': svr['nic-mapping'] || 'placeholder-HP-DL360-6PORT', //fake one TODO
            'ilo-ip': svr['ilo-ip'] || '10.10.10.10',
            'ilo-password': svr['ilo-password'] ||'password',
            'ilo-user': svr['ilo-user']|| 'admin',
            'server-group': svr['server-group'] || 'RACK1'
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

  //TODO
  //save model updates before move to next page
  goForward(e) {
    e.preventDefault();
    this.doSave();
  }

  render() {
    //server list without details
    let displayAvailableServers = this.state.displayAvailableServers;
    let clearAvailCheckBox = this.clearAvailableServerSelections;
    let clearAssignCheckBox = this.clearAssignedServerSelections;
    let modelName = this.state.selectedModelName;
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
      <div className='wizardContentPage'>
        {this.renderHeading(translate('assign.server.role.heading', modelName))}
        <div className="server-container">
          <div className="heading">{availableServersHeading}</div>
          <SearchBar
            filterText={this.state.searchFilterText}
            filterAction={this.handleSearchText}/>
          <div className="server-list-container">
            <ServerList
              ref='available' data={filteredAvailableServers}
              clearSelections={clearAvailCheckBox} onSelectRow={this.handleAvailableServerRowSelect}
              onSelectAll={this.handleAvailableServerSelectAll}>
            </ServerList>
          </div>
        </div>
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
        <div className="server-container">
          <div className="heading">{targetServerRoleHeading}</div>
          <ServerRolesDropDown
            serverRoles={roles} selectedServerRole={selectedRoleName}
            selectAction={this.handleRoleSelect}>
          </ServerRolesDropDown>
          <div className="server-list-container">
            <ServerList
              ref='assign' data={displayAssignedServers}
              clearSelections={clearAssignCheckBox} onSelectRow={this.handleAssignedServerRowSelect}
              onSelectAll={this.handleAssignedServerSelectAll}>
            </ServerList>
          </div>
        </div>
        <div>
          <ActionButton clickAction={this.handleDiscovery} displayLabel={discoverLabel}/>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

class ServerRolesDropDown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedName: this.props.selectedServerRole
    };
    this.renderOptions = this.renderOptions.bind(this);
    this.handleRoleSelect = this.handleRoleSelect.bind(this);
  }

  renderOptions() {
    let options = this.props.serverRoles.map((role) => {
      let optionDisplay =
        role.name + ' (' + role.serverRole + ' ' + role.servers.length + '/' + role.memberCount + ')';
      return <option key={role.serverRole} value={role.name}>{optionDisplay}</option>;
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
    //TODO have problem change select font-size
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
  }

  componentWillReceiveProps(newProps) {
    this.setState({serverList : newProps.data});
  }

  handleSelectRow(e, rowData) {
    let isChecked = e.target.checked;
    this.props.onSelectRow(isChecked, rowData);
  }

  renderServerList(list) {
    let servers = [];
    let toClear = this.props.clearSelections;
    let handleRowFunc = this.handleSelectRow;
    list.forEach((server, idx) => {
      let item =
        <ServerItem
          key={idx} serverItem={server} clearSelection={toClear}
          changeAction={(e) => handleRowFunc(e, server)}>
        </ServerItem>;
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
    this.handleCheckBoxChange = this.handleCheckBoxChange.bind(this);
    this.state = {
      checked: false
    };
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
        <input
          id='serverItemId' type='checkbox' value={itemValue}
          checked={this.state.checked}
          onChange={(e) => this.handleCheckBoxChange(e, data)}/> {displayName}
      </div>
    );
  }
}
export default AssignServerRoles;
