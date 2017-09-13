import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import { getAppConfig } from '../components/ConfigHelper.js';
import { ActionButton } from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';
import { SearchBar, ServerRolesAccordion } from '../components/ServerUtils.js';
import { BaseInputModal } from '../components/Modals.js';
import ConnectionCredsInfo from '../components/ConnectionCredsInfo';
import { ErrorMessage } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';
import ServerDragDropTable from '../components/ServerDragDropTable.js'
import ServerRowItemsDragLayer from '../components/ServerRowItemsDragLayer.js';
import EditServerDetails from '../components/EditServerDetails.js'

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
    this.errorContent = undefined;

    this.rawDiscoveredServers = []; //TODO load and save from shim

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
    this.selectedServerRole = '';
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
      //when loading data or saving data
      loading: false,
      //show error message
      showError: false,
      //show server details modal
      showServerDetails: false,
      //show edit server details modal
      showEditServerDetailsModal: false
    };

    this.handleManualAddServer = this.handleManualAddServer.bind(this);
    this.handleAddServerFromCSV = this.handleAddServerFromCSV.bind(this);
  }

  refreshServers(rawServerData) {
    this.setState({
      displayAssignedServers: [],
      displayAvailableServers: [],
      searchFilterText: ''
      //TODO clear the selections
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

  getSumaServersData(tokenKey) {
    //TODO just passing the tokenKey doesn't seem to work..
    //it has to go with the same rpc client need dig more
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/sm/servers')
        .then((response) => this.checkResponse(response))
        .then(response => response.json())
    );
  }

  doSumaDiscovery(tokenKey) {
    let promise = new Promise((resolve, reject) => {
      this.getSumaServersData(tokenKey)
      .then((rawServerData) => {
        if (rawServerData && rawServerData.length > 0) {
          let ids = rawServerData.map((srv) => {
            return srv.id;
          });

          this.getSumaAllServerDetailsData(ids, tokenKey)
            .then((details) => {
              rawServerData = this.updateSumaServerDataWithDetails(details);
              resolve(rawServerData);
            })
            .catch((error) => {
              //TODO
              console.log(JSON.stringify(error))
            });
        }
      })
      .catch((error) => {
        let msg = translate('server.discover.suma.error');
        let msgContent = {
          messages: [msg, error.toString()]
        };

        if (this.errorContent !== undefined) {
          msgContent.messages = msgContent.messages.concat(this.errorContent.messages);
        }
        this.errorContent = msgContent;
        reject(error);
      });
    });
    return promise;
  }

  //run discovery for suma and/or oneview parallelly
  //meanwhile also go update the table data with more details by query
  //detail one by one in parallel.
  doAllDiscovery = () => {
    let promises = [];
    if(this.credentials.suma) {
      let token =
        this.credentials.suma.sessionKey ? this.credentials.suma.sessionKey : this.credentials.suma.token;
      promises.push(this.doSumaDiscovery(token));
    }

    if(this.credentials.oneview) {
      //TODO add oneview discovery in promise array
    }

    return Promise.all(promises);
  }

  checkResponse(response) {
    if (!response.ok) {
      throw Error(response.url + ':' + response.statusText);
    }
    return response;
  }

  handleDiscovery = () => {
    this.setState({loading: true});
    this.rawDiscoveredServers = [];
    this.doAllDiscovery()
      .then((allServerData) => {
        //TODO save it to the backend
        allServerData.forEach((oneSet, idx) => {
          this.rawDiscoveredServers = this.rawDiscoveredServers.concat(oneSet);
        });
        this.setState({loading: false});
        this.refreshServers(this.rawDiscoveredServers);
      })
      .catch((error) => {
        this.setState({loading: false, showError: true});
      })
  }

  //handle filter text change
  handleSearchText = (filterText) => {
    this.setState({searchFilterText: filterText});
  }

  handleSelectServerTab = (tabKey) =>  {
    this.setState({selectedServerTabKey: tabKey});
  }

  handleManualAddServer() {
    //TODO
  }

  handleAddServerFromCSV() {
    //TODO
  }

  handleConfDiscovery = () => {
    //show modal for credential inputs
    //when it is done from  modal..it will save
    //the credential information and session key
    this.setState({showCredsModal: true});
  }

  handleCancelCredsInput = () => {
    this.setState({showCredsModal: false});
  }

  handleDoneCredsInput = (credsData) => {
    this.setState({
      showCredsModal: false,
    });
    if (credsData.suma) {
      this.credentials.suma = credsData.suma;
      //TODO save sessionKey to cookie store
    }
    if (credsData.oneview) {
      this.credentials.oneview = credsData.oneview;
    }
    //TODO save credentials to backend
    //TODO save tokenkey to global varible...need to figure out how to use the sessionToken

    if (this.rawDiscoveredServers.length === 0) {
      this.setState({loading: true});
      this.rawDiscoveredServers = [];
      this.doAllDiscovery()
        .then((allServerData) => {
          //TODO save it to the backend
          allServerData.forEach((oneSet, idx) => {
            this.rawDiscoveredServers = this.rawDiscoveredServers.concat(oneSet);
          });
          this.refreshServers(this.rawDiscoveredServers);
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
    this.setState({showServerDetails: true});
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

  handleMoveItemsAutoDiscoverTable = (items, source) => {
    let leftItems = [];
    //assign
    if(source === 'left') {
      leftItems = this.state.displayAvailableServers.filter(
        (server) => items.findIndex((item) => server.id === item.id) < 0);
    }
    else { //unassign
      leftItems = this.state.displayAvailableServers.concat(items);
    }
    let rightItems = [];
    if(source === 'left') { //assign
      rightItems = this.state.displayAssignedServers.concat(items);
    }
    else { //unassign
      rightItems = this.state.displayAssignedServers.filter(
        (server) => items.findIndex((item) => server.id === item.id) < 0);
    }

    let serverRole = this.serverRoles.find((role) => {
      return (this.state.selectedServerRole === role.serverRole);
    });

    //TODO debug
    if(serverRole) {
      serverRole.servers = rightItems;
    }

    this.setState({displayAvailableServers: leftItems});
    this.setState({displayAssignedServers: rightItems});

    //check if we meet the model object server role
    //requirements
    this.validateServerRoleAssignment();
  }

  handleShowEditServerDetails = (rowData) => {
    this.setState({showEditServerDetailsModal: true});
    this.activeRowData = rowData;
  }

  //get model object before render UI
  componentWillMount() {
    try {
      this.credentials.suma.token = apiToken; //global suma token when embedded
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

  updateSumaServerDataWithDetails = (details) => {
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
        'source': 'suma'
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

  //prototype query SUMA for details
  getSumaOneServerDetailData = (shimUrl, sumaTokenKey) => {
    //TODO passing sumaTokenKey got from test doesn't seem to work..
    //it has to go with the same rpc client need dig more
    let promise = new Promise((resolve, reject) => {
      fetch(shimUrl)
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

  getSumaAllServerDetailsData = (serverIds, sumaTokenKey) => {
    let promises = [];
    serverIds.forEach((id) => {
      let shimUrl = getAppConfig('shimurl') + '/api/v1/sm/servers/' + id;
      promises.push(this.getSumaOneServerDetailData(shimUrl, sumaTokenKey));
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
      <div className='server-drag-drop-table'>
        <ServerRowItemsDragLayer/>
        <ServerDragDropTable
          id='left'
          className='available-table-container'
          tableConfig={tableConfig}
          tableData={filteredAvailableServers}
          moveAction={this.handleMoveItemsAutoDiscoverTable}
          doubleClickAction={this.handleShowServerDetails}>
        </ServerDragDropTable>
      </div>
    )
  }

  renderAutoDiscoverContent() {
    //only render when don't have any raw discovered data
    if(this.rawDiscoveredServers.length === 0) {
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

  renderManualAddServerContent() {
    return (
      <div className='btn-row centered'>
        <ActionButton
          clickAction={this.handleManualAddServer}
          displayLabel={translate('add.server.add')}/>
        <ActionButton
          clickAction={this.handleAddServerFromCSV}
          displayLabel={translate('add.server.add.csv')}/>
      </div>
    );
  }

  //gloria
  renderSearchBarContent() {
    if(this.rawDiscoveredServers.length === 0) {
      return (
        <SearchBar
          filterText={this.state.searchFilterText}
          filterAction={this.handleSearchText}>
        </SearchBar>
      );
    }
    else {
      return (
        <div className='search-config-container'>
          <SearchBar
            className='shorter'
            filterText={this.state.searchFilterText}
            filterAction={this.handleSearchText}>
          </SearchBar>
          <div className='config-buttons-container'>
            <ActionButton
              className='more-margin-left'
              clickAction={this.handleConfDiscovery}
              displayLabel={translate('add.server.conf.discover')}/>
            <ActionButton
              className='more-margin-left'
              clickAction={this.handleDiscovery}
              displayLabel={translate('add.server.discover')}/>
          </div>
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
          {this.state.selectedServerTabKey === MANUALADD_TAB && this.renderManualAddServerContent()}
        </Tab>
      </Tabs>
    );
  }

  renderServerRolesAccordion(roles) {
    return (
      <ServerRolesAccordion
        serverRoles={this.serverRoles}
        clickAction={this.handleClickRoleAccordion}
        tableId='right'
        displayServers={this.state.displayAssignedServers}
        tableMoveAction={this.handleMoveItemsAutoDiscoverTable}
        doubleClickAction={this.handleShowEditServerDetails}>
      </ServerRolesAccordion>
    );
  }

  renderServerRoleContent() {
    return (
      <div className='assign-server-role body-container'>
        <div className="server-container">
          {this.renderSearchBarContent()}
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
        {this.renderEditServerDetailsModal()}
        {this.renderLoadingMask()}
        {this.renderErrorMessage()}
      </div>
    );
  }
}

const dragDropContext = DragDropContext;
export default dragDropContext(HTML5Backend)(AssignServerRoles);
