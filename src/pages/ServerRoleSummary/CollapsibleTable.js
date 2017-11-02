// (c) Copyright 2017 SUSE LLC
import React, { Component } from 'react';
import { translate } from '../../localization/localize.js';
import EditServerDetails from './EditServerDetails.js';
import ViewServerDetails from '../AssignServerRoles/ViewServerDetails.js';
import { getNicMappings, getServerGroups } from '../../utils/ModelUtils.js';
import { BaseInputModal } from '../../components/Modals.js';
import { List, Map } from 'immutable';
import { byServerNameOrId } from '../../utils/Sort.js';

class CollapsibleTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showEditServerModal: false,
      showServerDetailsModal: false,
      activeRowData: undefined,
      model: this.props.model
    };
  }

  componentWillReceiveProps(newProps) {
    if (this.state.model !== newProps.model) {
      this.setState({model: newProps.model});
    }
  }

  handleDoneEditServer = (server) => {
    this.props.saveEditServer(server);
    this.setState({showEditServerModal: false, activeRowData: undefined});
  }

  handleCancelEditServer = () => {
    this.setState({showEditServerModal: false, activeRowData: undefined});
  }

  handleShowEditServer = (rowData) => {
    this.setState({showEditServerModal: true, activeRowData: rowData});
  }

  handleCancelServerDetails = () => {
    this.setState({showServerDetailsModal: false, activeRowData: undefined});
  }

  handleShowServerDetails = (rowData) => {
    this.setState({showServerDetailsModal: true, activeRowData: rowData});
  }

  toggleShowHide(event, clickedGroup, wasExpanded) {
    if (wasExpanded) {
      this.props.removeExpandedGroup(clickedGroup);
    } else {
      this.props.addExpandedGroup(clickedGroup);
    }
  }

  getSeverData = (server) => {
    let retData = {};
    this.props.tableConfig.columns.forEach((colDef) => {
      if(colDef.name === 'name') {
        retData[colDef.name] = server.get('name') || server.get('id');
      }
      else {
        retData[colDef.name] = server.get(colDef.name);
      }
    });

    return retData;
  }

  formatServerObjects = () => {
    const servers = this.state.model.getIn(['inputModel','servers']);
    // Create a map of role names to list of servers in each, e.g.
    //   { 'COMPUTE':[{name:'one',...},{name:'two',...},  'CONTROLLER': [...]}
    let groupMap = Map();
    servers.sort((a,b) => byServerNameOrId(a.toJS(),b.toJS())).forEach(server => {
      groupMap = groupMap.update(server.get('role'),
        new List(),           // create a new list if role is not in groupMap
        list => list.push(    // append this server to the role's list
          this.getSeverData(server)
        ));
    });

    // Convert the map to a list of objects and return it, e.g.
    //  [ {groupName:'COMPUTE', members:[{name:'one',...},{name:'two',...},
    //    {groupName:'CONTROLLER', members:[..]}... ]
    return groupMap.keySeq().sort()         // get a sorted list of keys
      .map(g => new Map({
        'groupName': g,
        'members': groupMap.get(g),
        'isExpanded': this.props.expandedGroup.includes(g)}))
      .toJS();                              // return as JavaScript objects
  }

  isRoleGroupValid = (group) => {
    if(this.props.checkInputs) {
      return group.members.every((server) =>
        this.props.checkInputs.every(key => (server[key] ? true : false))
      );
    }
  }

  isDataRowValid = (member) => {
    let isValid = true;
    let badInput = undefined;
    if(this.props.checkInputs) {
      badInput = this.props.checkInputs.find((key) => {
        return (member[key] === undefined || member[key] === '');
      });
    }
    if(badInput) {
      isValid = false;
    }
    return isValid;
  }

  renderServerDataCols(server) {
    let count = 0;
    let cols = [];
    this.props.tableConfig.columns.forEach((colDef) => {
      if(!colDef.hidden) {
        cols.push(<td key={server['name'] + count++}><div>{server[colDef.name]}</div></td>);
      }
    });

    cols.push(
      <td key='action-buttons'>
        <span className='glyphicon glyphicon-pencil edit'
          onClick={() => this.handleShowEditServer(server)}/>
        <span className='glyphicon glyphicon-info-sign detail-info'
          onClick={() => this.handleShowServerDetails(server)}/>
      </td>
    );
    return cols;
  }

  renderGroup(group) {
    let groupCountColClassName = 'expand-collapse-icon ';
    groupCountColClassName += group.isExpanded ? 'glyphicon glyphicon-menu-up' :
      'glyphicon glyphicon-menu-down';

    let fillerTds = [];
    for (let i=0; i<Object.keys(group.members[0]).length - 7; i++) {
      fillerTds.push(<td key={i}></td>);
    }

    let groupRowClass = 'group-row';
    groupRowClass = this.isRoleGroupValid(group) ? groupRowClass : groupRowClass + ' has-error';

    let groupRows = [<tr className={groupRowClass} key={group.groupName}
      onClick={(event) => this.toggleShowHide(event, group.groupName, group.isExpanded)}>
      <td>{group.groupName}</td>
      {fillerTds}
      <td></td>
      <td className='group-count-col'>{group.members.length}
        <span className={groupCountColClassName}></span></td></tr>];
    group.members.forEach((member) => {
      let cols = this.renderServerDataCols(member);
      let memberRowClassName = 'member-row';
      memberRowClassName =
        this.isDataRowValid(member) ? memberRowClassName : memberRowClassName + ' required-update';
      memberRowClassName += group.isExpanded ? ' show-row' : ' hide-row';
      groupRows.push(<tr className={memberRowClassName} key={member['name']}>{cols}</tr>);
    });

    return groupRows;
  }

  renderEditServerModal() {
    return (
      <BaseInputModal
        show={this.state.showEditServerModal} className='edit-details-dialog'
        onHide={this.handleCancelEditServer} title={translate('edit.server.details.heading')}>
        <EditServerDetails
          cancelAction={this.handleCancelEditServer} doneAction={this.handleDoneEditServer}
          serverGroups={getServerGroups(this.state.model)} nicMappings={getNicMappings(this.state.model)}
          data={this.state.activeRowData}>
        </EditServerDetails>
      </BaseInputModal>
    );
  }

  renderServerDetailsModal() {
    return (
      <BaseInputModal
        show={this.state.showServerDetailsModal} className='view-details-dialog'
        onHide={this.handleCancelServerDetails} title={translate('view.server.details.heading')}>
        <ViewServerDetails
          cancelAction={this.handleCancelServerDetails} data={this.state.activeRowData}>
        </ViewServerDetails>
      </BaseInputModal>
    );
  }
  render() {
    // data should be in this following format:
    // [{"groupName": "Group A", members: [{"id": "Server1", "addr": "192.168.2.2"}, {..}]},
    //  {"groupName": "Group B", members: [{..}, {..}, {..}]]
    // Keywords are "groupName" and "members", where group is the name of the collapsible category
    // and members are the category's members which will be displayed under the category
    let data = this.formatServerObjects();
    let rows = data.map((group) => {return this.renderGroup(group);});
    return (
      <div className='collapsible-table'>
        <div className='rounded-corner'>
          <table className='full-width'><tbody>{rows}</tbody></table>
        </div>
        {this.renderEditServerModal()}
        {this.renderServerDetailsModal()}
      </div>
    );
  }
}

export default CollapsibleTable;
