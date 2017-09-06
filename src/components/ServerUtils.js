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

class ServerInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorMsg: '',
      inputValue: this.props.inputValue
    };
    this.handleInputChange = this.handleInputChange.bind(this);
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

  handleInputChange(e, props) {
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

module.exports = {
  SearchBar: SearchBar,
  ServerRolesAccordion: ServerRolesAccordion,
  ServerInput: ServerInput
};
