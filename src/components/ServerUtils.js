import React, { Component } from 'react';
import Collapsible from 'react-collapsible';
import '../Deployer.css';
import { translate } from '../localization/localize.js';

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

class ServerRolesAccordion extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accordionPosition: 0
    };
    this.handleTriggerClick = this.handleTriggerClick.bind(this);
  }

  //TODO temp implment...need table with drag and drop
  renderServerTable(servers) {
    let items = [];
    servers.forEach((server, idx) => {
      let item = <div key={idx}>{server.name}</div>;
      items.push(item);
    });
    return items;
  }

  handleTriggerClick(position, role) {
    this.setState({accordionPosition: position});
    this.props.clickAction(role);
  }

  renderSections() {
    let sections = this.props.serverRoles.map((role, idx) => {
      let optionDisplay = '';
      if(role.minCount === 0) {
        optionDisplay =
          translate(
            'add.server.role.no.min.display',
            role.name, role.serverRole, role.servers.length
          );
      }
      else {
        if(role.minCount !== undefined) {
          optionDisplay =
            translate(
              'add.server.role.min.count.display',
              role.name, role.serverRole, role.servers.length, role.minCount
            );
        }
        else {
          optionDisplay =
            translate(
              'add.server.role.member.count.display',
              role.name, role.serverRole, role.servers.length, role.memberCount
            );
        }
      }
      return (
        <Collapsible
          open={idx === this.state.accordionPosition}
          trigger={optionDisplay.join(' ')} key={role.name}
          handleTriggerClick={() => this.handleTriggerClick(idx, role)}
          value={role.serverRole}>
          {this.renderServerTable(role.servers)}
        </Collapsible>
      );
    });

    return sections;
  }

  render() {
    return (
      <div className='roles-accordion'>
        {this.renderSections()}
      </div>
    );
  }
}

module.exports = {
  SearchBar: SearchBar,
  ServerRolesAccordion: ServerRolesAccordion
};
