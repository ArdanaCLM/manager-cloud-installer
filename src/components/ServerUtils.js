import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';

import { ItemMenuButton } from '../components/Buttons.js';

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

  renderServerList(list, isSelectable) {
    let servers = [];
    list.forEach((server, idx) => {
      let item = undefined;
      if(isSelectable) {
        if (this.props.checkKeys) {
          let requiredUpdate = false;
          let input = this.props.checkKeys.find((key) => {
            return (server[key] === undefined || server[key] === '');
          });
          if (input) {
            requiredUpdate = true;
          }
          item = (
            <SelectableServerItem
              key={idx} requiredUpdate={requiredUpdate}
              data={server} unSelect={this.props.unSelectAll}
              clickMenuAction={(e) => this.handleShowMenu(e, server)}
              changeAction={(e) => this.handleSelectRow(e, server)}>
            </SelectableServerItem>
          );
        }
        else {
          item = (
            <SelectableServerItem
              key={idx} data={server} unSelect={this.props.unSelectAll}
              clickMenuAction={(e) => this.handleShowMenu(e, server)}
              changeAction={(e) => this.handleSelectRow(e, server)}>
            </SelectableServerItem>
          );
        }
      }
      else {
        item = (<ServerItem key={idx} data={server}></ServerItem>);
      }
      servers.push(item);
    });
    return servers;
  }

  render() {
    let serverList = this.state.serverList;
    let isSelectable = this.props.onSelectRow !== undefined;
    return (
      <div className="server-list">
        {this.renderServerList(serverList, isSelectable)}
      </div>
    );
  }
}

class SelectableServerItem extends Component {
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
    let data = this.props.data;
    let moreClass = 'item-menu';
    let cName = 'server-check-box ';
    cName = cName + (this.props.requiredUpdate ? 'required-update' : '');
    return (
      <div className={cName}>
        <input
          type='checkbox' value={data.name}
          checked={this.state.checked}
          onChange={(e) => this.handleCheckBoxChange(e, data)}/> {data.name}
        <ItemMenuButton
          className={moreClass} clickAction={(e) => this.handleClickMenu(e, data)}/>
      </div>
    );
  }
}

class ServerItem extends Component {
  render() {
    let data = this.props.data;
    return (
      <div>{data.name}</div>
    );
  }
}

module.exports = {
  SearchBar: SearchBar,
  ServerRolesDropDown: ServerRolesDropDown,
  ServerList: ServerList
};
