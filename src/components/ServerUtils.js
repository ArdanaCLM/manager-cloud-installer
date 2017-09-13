import React, { Component } from 'react';
import Collapsible from 'react-collapsible';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import ServerDragDropTable from './ServerDragDropTable.js';

class SearchBar extends Component {
  constructor(props) {
    super(props);
  }

  handleFilterTextInputChange = (e) => {
    e.preventDefault();
    this.props.filterAction(e.target.value);
  }

  render() {
    let cName = 'search-container ';
    cName = this.props.className ? cName + this.props.className : cName;
    return (
      <div className={cName}>
        <span className='search-bar'>
          <input
            type="text" placeholder={translate('placeholder.search.server.text')}
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
      accordionPosition: 0,
      activeServers: this.props.displayServers
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({activeServers: nextProps.displayServers});
  }

  handleTriggerClick = (position, role) => {
    this.setState({accordionPosition: position});
    this.props.clickAction(role);
    this.setState({activeServers: role.servers});
  }

  renderAccordionServerTable(servers) {
    //displayed columns
    let tableConfig = {
      columns: [
        {name: 'id', hidden: true},
        {name: 'name'},
        {name: 'ip-addr'},
        {name: 'mac-addr'},
        {name: 'role'},
        {name: 'server-group'},
        {name: 'nic-mapping'},
        {name: 'source', hidden: true}
      ]
    };
    return (
      <ServerDragDropTable
        id={this.props.tableId}
        className='accordion-table-container'
        noHeader
        tableConfig={tableConfig}
        tableData={this.state.activeServers}
        moveAction={this.props.tableMoveAction}
        doubleClickAction={this.props.doubleClickAction}>
      </ServerDragDropTable>
    );
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
      let isOpen = idx === this.state.accordionPosition;
      return (
        <Collapsible
          open={isOpen}
          trigger={optionDisplay.join(' ')} key={role.name}
          handleTriggerClick={() => this.handleTriggerClick(idx, role)}
          value={role.serverRole}>
          {isOpen && this.renderAccordionServerTable(role.servers)}
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

class ServerInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorMsg: '',
      inputValue: this.props.inputValue
    };
  }

  componentDidMount() {
    if(this.props.updateFormValidity) {
      let isValid = this.validateInput(this.state.inputValue);
      //callback function from parent to initially check
      //all inputs
      this.props.updateFormValidity(this.props, isValid);
    }
  }

  validateInput(val) {
    let retValid = false;

    if(this.props.isRequired) {
      if(val === undefined || val.length === 0) {
        this.setState({errorMsg: translate('server.input.required.error')});
        return retValid;
      }
    }

    if(this.props.inputValidate) {//have a validator
      let validateObject = this.props.inputValidate(val);
      if (validateObject) {
        if(validateObject.isValid) {
          this.setState({errorMsg: ''});
          retValid = true;
        }
        else {
          this.setState({
            errorMsg: validateObject.errorMsg
          });
        }
      }
      else {
        this.setState({errorMsg: translate('server.validator.error')});
      }
    }
    else {  //don't have validator
      retValid = true;
      this.setState({ errorMsg: ''});
    }

    return retValid;
  }

  handleInputChange = (e, props) => {
    let val = e.target.value;
    let valid = this.validateInput(val);
    this.setState({
      inputValue: val
    });

    //call back function from parent to handle the
    //change...also it will call updateFormValidity
    //to check all the inputs
    this.props.inputAction(e, valid, props);
  }

  render() {
    let inputType = 'text';
    if(this.props.inputType) {
      inputType = this.props.inputType;
    }
    let props = {};
    if (inputType === 'number') {
      props.min = this.props.min;
      props.max = this.props.max;
    }

    return (
      <div className='server-input'>
        <input
          className='rounded-corner'
          required={this.props.isRequired}
          type={inputType} name={this.props.inputName}
          value={this.state.inputValue}
          onChange={(e) => this.handleInputChange(e, this.props)}
          {...props}>
        </input>
        <div className='error-message'>{this.state.errorMsg}</div>
      </div>
    );
  }
}

class ServerDetailDropDown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedName: this.props.selectedName
    };
  }

  handleSelect = (e) => {
    this.setState({selectedName: e.target.value});
    this.props.selectAction(e.target.value);
  }

  componentWillReceiveProps(newProps) {
    this.setState({selectedName : newProps.selectedName});
  }

  renderOptions() {
    let options = this.props.optionList.map((opt) => {
      return <option key={opt} value={opt}>{opt}</option>;
    });

    return options;
  }

  render() {
    return (
      <div className="server-detail-select">
        <select
          className='rounded-corner'
          value={this.state.selectedName}
          type="select" onChange={this.handleSelect}>
          {this.renderOptions()}
        </select>
      </div>
    );
  }
}

module.exports = {
  SearchBar: SearchBar,
  ServerRolesAccordion: ServerRolesAccordion,
  ServerInput: ServerInput,
  ServerDetailDropDown: ServerDetailDropDown
};
