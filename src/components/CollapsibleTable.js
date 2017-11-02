// (c) Copyright 2017 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
import React, { Component } from 'react';
import '../Deployer.css';

class CollapsibleTable extends Component {
  constructor(props) {
    super(props);
    // props.data should be in this following format:
    // [{"groupName": "Group A", members: [{"id": "Server1", "addr": "192.168.2.2"}, {..}]},
    //  {"groupName": "Group B", members: [{..}, {..}, {..}]]
    // Keywords are "groupName" and "members", where group is the name of the collapsible category
    // and members are the category's members which will be displayed under the category
  }

  toggleShowHide(event, clickedGroup, wasExpanded) {
    if (wasExpanded) {
      this.props.removeExpandedGroup(clickedGroup);
    } else {
      this.props.addExpandedGroup(clickedGroup);
    }
  }

  renderGroup(group) {
    let groupCountColClassName = 'expand-collapse-icon ';
    groupCountColClassName += group.isExpanded ? 'glyphicon glyphicon-menu-up' :
      'glyphicon glyphicon-menu-down';

    let fillerTds = [];
    for (let i=0; i<Object.keys(group.members[0]).length-2; i++) {
      fillerTds.push(<td key={i}></td>);
    }

    let groupRows = [<tr className='group-row' key={group.groupName}
      onClick={(event) => this.toggleShowHide(event, group.groupName, group.isExpanded)}>
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
      memberRowClassName += group.isExpanded ? ' show-row' : ' hide-row';
      groupRows.push(<tr className={memberRowClassName} key={serverName}>{cols}</tr>);
    });
    return groupRows;
  }

  render() {
    let rows = this.props.data.map((group) => {return this.renderGroup(group);});
    return (
      <div className='collapsible-table'>
        <div className='rounded-corner'>
          <table className='full-width'><tbody>{rows}</tbody></table>
        </div>
      </div>
    );
  }
}

export default CollapsibleTable;
