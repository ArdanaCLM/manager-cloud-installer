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
import Collapsible from 'react-collapsible';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import ServerTable from './ServerTable.js';
import { isRoleAssignmentValid } from '../utils/ModelUtils.js';

export class SearchBar extends Component {
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
          <input className='rounded-corner'
            type="text" placeholder={translate('placeholder.search.server.text')}
            value={this.props.filterText} onChange={this.handleFilterTextInputChange}/>
        </span>
        <span className='glyphicon glyphicon-search search-icon'></span>
      </div>
    );
  }
}

export class ServerRolesAccordion extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accordionPosition: 0
    };
  }

  handleTriggerClick = (idx, role) => {
    this.setState({accordionPosition: idx});
  }

  renderAccordionServerTable(servers) {
    //displayed columns
    let tableConfig = {
      columns: [
        {name: 'id', hidden: true},
        {name: 'name'},
        {name: 'ip-addr'},
        {name: 'mac-addr'},
        {name: 'role', hidden: true},
        {name: 'server-group', hidden: true},
        {name: 'nic-mapping', hidden: true},
        {name: 'ilo-ip', hidden: true},
        {name: 'ilo-user', hidden: true},
        {name: 'ilo-password', hidden: true},
        {name: 'source', hidden: true}
      ]
    };

    const serverList = this.props.serverRoles[this.state.accordionPosition].servers;

    return (
      <ServerTable
        id={this.props.tableId}
        noHeader
        tableConfig={tableConfig}
        checkInputs={this.props.checkInputs}
        tableData={serverList}
        editAction={this.props.editAction}
        viewAction={this.props.viewAction}/>
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
      let isOpen = (idx === this.state.accordionPosition);
      let valid = isRoleAssignmentValid(role);
      let triggerClass = valid ? '' : 'has-error';

      return (
        <div
          onDrop={(event) => this.props.ondropFunct(event, role.serverRole)}
          onDragOver={(event) => this.props.allowDropFunct(event, role.serverRole)}
          onDragEnter={(event) => this.props.ondragEnterFunct(event)}
          onDragLeave={(event) => this.props.ondragLeaveFunct(event)}
          className='server-dropzone'
          key={role.name}>
          <Collapsible
            open={isOpen} key={role.name}
            trigger={optionDisplay} triggerClassName={triggerClass}
            triggerOpenedClassName={triggerClass}
            handleTriggerClick={() => this.handleTriggerClick(idx, role)}
            value={role.serverRole}>
            {isOpen && this.renderAccordionServerTable()}
          </Collapsible>
        </div>
      );
    });

    return sections;
  }

  render() {
    return (
      <div className='roles-accordion'>{this.renderSections()}</div>
    );
  }
}

export class ServerInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorMsg: '',
      inputValue: this.props.inputValue,
      showMask: true
    };
  }

  componentDidMount() {
    if(this.props.updateFormValidity) {
      let isValid = this.validateInput(this.state.inputValue, this.props);
      //callback function from parent to initially check
      //all inputs
      this.props.updateFormValidity(this.props, isValid);
    }
  }

  componentWillReceiveProps(newProps) {
    if (this.props.inputValue !== newProps.inputValue) {
      this.setState({inputValue : newProps.inputValue});
    }
  }

  validateInput(val, extraProps) {
    let retValid = false;

    if(this.props.isRequired) {
      if(val === undefined || val.length === 0) {
        this.setState({errorMsg: translate('server.input.required.error')});
        return retValid;
      }
    }

    if(this.props.inputValidate && val !== '' && val !== undefined) {//have a validator and have some values
      let validateObject = this.props.inputValidate(val, extraProps);
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
    let valid = this.validateInput(val, props);
    this.setState({
      inputValue: val
    });

    //call back function from parent to handle the
    //change...also it will call updateFormValidity
    //to check all the inputs
    this.props.inputAction(e, valid, props);
  }

  toggleShowHidePassword(inputFieldId) {
    let passwordField = document.getElementById(inputFieldId);
    passwordField.type = this.state.showMask ? 'text' : 'password';
    this.setState((prevState) => {return {showMask: !prevState.showMask};});
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

    let togglePassword = '';
    let inputId = 'serverInputField';
    if (inputType === 'password') {
      inputId = 'serverPasswordField'  + (Math.random(0,1) * 100000) + '';
      if (this.state.showMask) {
        togglePassword = <i className='material-icons password-icon'
          onClick={() => this.toggleShowHidePassword(inputId)}>visibility</i>;
      } else {
        togglePassword = <i className='material-icons password-icon'
          onClick={() => this.toggleShowHidePassword(inputId)}>visibility_off</i>;
      }
    }

    return (
      <div className='server-input'>
        <input
          id={inputId}
          className='rounded-corner'
          required={this.props.isRequired}
          type={inputType} name={this.props.inputName}
          value={this.state.inputValue}
          onChange={(e) => this.handleInputChange(e, this.props)}
          placeholder={this.props.placeholder}
          disabled={this.props.disabled}
          autoFocus={this.props.autoFocus}
          {...props}>
        </input>
        {togglePassword}
        <div className='error-message'>{this.state.errorMsg}</div>
      </div>
    );
  }
}

export class ServerInputLine extends Component {
  render() {
    let labelStr = this.props.label ? translate(this.props.label) : '';
    let label = this.props.label ? ((this.props.isRequired) ? labelStr + '*' : labelStr) : '';
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{label}</div>
        <div className='input-body'>
          <ServerInput isRequired={this.props.isRequired} inputName={this.props.inputName}
            inputType={this.props.inputType} inputValidate={this.props.inputValidate} {... this.props}
            inputAction={this.props.inputAction} inputValue={this.props.inputValue}
            updateFormValidity={this.props.updateFormValidity} category={this.props.category}/>
        </div>
      </div>
    );
  }
}

export class ServerDropdown extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.props.value
    };
  }

  handleSelect = (e) => {
    this.setState({value: e.target.value});
    this.props.selectAction(e.target.value);
  }

  componentWillReceiveProps(newProps) {
    if (this.state.value !== newProps.value) {
      this.setState({value : newProps.value});
    }
  }

  renderOptions() {
    let options = this.props.optionList.map((opt) => {
      if (this.props.defaultOption && opt === this.props.defaultOption.value) {
        return <option key={opt} value={opt}>{this.props.defaultOption.label}</option>;
      } else {
        return <option key={opt} value={opt}>{opt}</option>;
      }
    });

    if(this.props.emptyOption && (this.state.value === '' || this.state.value === undefined)) {
      let emptyOption = [
        <option
          key='noopt' value={this.props.emptyOption.value}>{this.props.emptyOption.label}
        </option>
      ];
      //add at the beginning
      options = emptyOption.concat(options);
    }

    return options;
  }

  render() {
    return (
      <div className="server-detail-select">
        <select className='rounded-corner' value={this.state.value} name={this.props.name}
          onChange={this.handleSelect}>{this.renderOptions()}</select>
      </div>
    );
  }
}

export class ServerDropdownLine extends Component {
  render() {
    let labelStr = this.props.label ? translate(this.props.label) : '';
    let label = this.props.label ? ((this.props.isRequired) ? labelStr + '*' : labelStr) : '';
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{label}</div>
        <div className='input-body'>
          <ServerDropdown name={this.props.name} value={this.props.value}
            optionList={this.props.optionList} emptyOption={this.props.emptyOption}
            selectAction={this.props.selectAction} defaultOption={this.props.defaultOption}/>
        </div>
      </div>
    );
  }
}

export function getModelIndexByName(model, key, name) {
  return model.getIn(['inputModel', key]).findIndex(e => e.get('name') === name);
}
