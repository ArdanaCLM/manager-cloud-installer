import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import { ActionButton } from '../components/Buttons.js';

class CollapsibleTable extends Component {
  constructor() {
    super();
    this.state = {
      data: [],
      // data should be in this following format:
      // [{"groupName": "Group A", members: [{"id": "Server1", "addr": "192.168.2.2"}, {..}]},
      //  {"groupName": "Group B", members: [{..}, {..}, {..}]]
      // Keywords are "groupName" and "members", where group is the name of the collapsible category
      // and members are the category's members which will be displayed under the category
      expandedGroup: [],
    };

    this.addExpandedGroup = this.addExpandedGroup.bind(this);
    this.removeExpandedGroup = this.removeExpandedGroup.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.data !== nextProps.data) {
      this.setState({data: nextProps.data});

      // expand only the first group at first
      let firstGroup = nextProps.data[0];
      this.addExpandedGroup(firstGroup.groupName);
    }
  }

  toggleShowHide(event, clickedGroup) {
    let index = this.state.expandedGroup.indexOf(clickedGroup);
    if (index === -1) {
      this.addExpandedGroup(clickedGroup);
    } else {
      this.removeExpandedGroup(clickedGroup);
    }
  }

  addExpandedGroup(groupName) {
    this.setState((prevState) => {
      return {'expandedGroup': prevState.expandedGroup.concat(groupName)};});
  }

  removeExpandedGroup(groupName) {
    this.setState((prevState) => {
      let index = prevState.expandedGroup.indexOf(groupName);
      if (index !== -1) {
        prevState.expandedGroup.splice(index, 1);
      }
      return {'expandedGroup': prevState.expandedGroup};
    });
  }

  isGroupExpanded(groupName) {
    let index = this.state.expandedGroup.indexOf(groupName);
    return (index === -1) ? false : true;
  }

  renderGroup(group) {
    let isExpanded = this.isGroupExpanded(group.groupName);
    let groupCountColClassName = 'expand-collapse-icon ';
    groupCountColClassName += isExpanded ? 'glyphicon glyphicon-menu-up' :
      'glyphicon glyphicon-menu-down';

    let fillerTds = [];
    for (let i=0; i<Object.keys(group.members[0]).length-2; i++) {
      fillerTds.push(<td key={i}></td>);
    }

    let groupRows = [<tr className='group-row' key={group.groupName}
      onClick={(event) => this.toggleShowHide(event, group.groupName)}>
      <td>{group.groupName}</td>
      {fillerTds}
      <td className='group-count-col'>{group.members.length}
        <span className={groupCountColClassName}></span></td></tr>];
    group.members.map((member) => {
      let cols = [];
      let serverName = '';
      for (let key in member) {
        if (key === 'name') {
          serverName = member[key];
        }
        cols.push(<td key={serverName+member[key]}><div>{member[key]}</div></td>);
      }

      let memberRowClassName = 'member-row';
      memberRowClassName += isExpanded ? ' show-row' : ' hide-row';
      groupRows.push(<tr className={memberRowClassName} key={serverName}>{cols}</tr>);
    });
    return groupRows;
  }

  expandAll() {
    let allGroups = this.state.data.map((group) => {return group.groupName;});
    this.setState({expandedGroup: allGroups});
  }

  renderExpandAllButton() {
    return this.props.showExpandAllButton ? (
      <div className='expand-all-btn-container'>
        <ActionButton
          className='expand-all-btn'
          displayLabel={translate('expand.all')}
          clickAction={() => this.expandAll()}/>
      </div>) : ('');
  }

  render() {
    let rows = this.state.data.map((group) => {return this.renderGroup(group);});
    return (
      <div className='collapsible-table'>
        {this.renderExpandAllButton()}
        <div className='rounded-corner'>
          <table className='full-width'><tbody>{rows}</tbody></table>
        </div>
      </div>
    );
  }
}

export default CollapsibleTable;
