import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import { ActionButton } from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';
import {
  IpV4AddressValidator, MacAddressValidator
} from '../components/InputValidators.js';

class EditServerDetails extends BaseWizardPage {

  constructor(props) {
    super(props);

    this.nicMappings = this.props.nicMappings;
    this.serverGroups = this.props.serverGroups;
    this.allInputsValidState = {
      'ip-addr': 0,
      'ilo-user': 0,
      'ilo-password': 0,
      'ilo-ip': 0,
      'mac-addr': 0
    };

    this.state = {
      data: this.props.editData,
      isFormValid: false
    };

    this.handleCancel = this.handleCancel.bind(this);
    this.handleDone = this.handleDone.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSelectGroup = this.handleSelectGroup.bind(this);
    this.handleSelectNicMapping = this.handleSelectNicMapping.bind(this);
    this.updateFormValidity = this.updateFormValidity.bind(this);
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      data : newProps.editData,
    });
  }

  updateFormValidity(name, isValid) {
    this.allInputsValidState[name] = isValid ? 1 : 0;
    let values = Object.values(this.allInputsValidState);
    let val = values.find((val) => {
      return val === 0;
    });

    if(val === 0) {
      this.setState({isFormValid: false});
    }
    else {
      this.setState({isFormValid: true});
    }
  }

  handleDone() {
    console.log('in handleDone : ' + JSON.stringify(this.state.data));
    this.props.doneAction(this.state.data);
  }

  handleCancel() {
    this.props.cancelAction(this.state.data);
  }

  handleSelectGroup(groupName) {
    this.state.data['server-group'] = groupName;
  }

  handleSelectNicMapping(nicMapName) {
    this.state.data['nic-mapping'] = nicMapName;
  }

  handleInputChange(e, isValid) {
    let name = e.target.name;
    let value = e.target.value; //don't have validator
    this.updateFormValidity(name, isValid);
    if(isValid) {
      this.state.data[name] = value;
    }
  }

  renderTextInput(name, type, validate) {
    if(validate) {
      return (
        <ServerTextInput
          isRequired={true} inputName={name} inputType={type}
          inputValidate={validate} inputValue={this.state.data[name]}
          inputAction={this.handleInputChange} updateFormValidity={this.updateFormValidity}>
        </ServerTextInput>
      );
    }
    else {
      return (
        <ServerTextInput
          isRequired={true} inputName={name} inputType={type}
          inputValue={this.state.data[name]} updateFormValidity={this.updateFormValidity}
          inputAction={this.handleInputChange}>
        </ServerTextInput>
      );
    }
  }

  renderDropDown(name, list, handler) {
    return (
      <ServerDetailDropDown
        selectedName={this.state.data[name]}
        optionList={list}
        selectAction={handler}>
      </ServerDetailDropDown>
    );
  }

  render() {
    if(!this.state.data['server-group']) {
      this.state.data['server-group'] = this.serverGroups[0];
    }

    if(!this.state.data['nic-mapping']) {
      this.state.data['nic-mapping'] = this.nicMappings[0];
    }
    return (
      <div className='wizardContentPage'>
        {this.renderHeading(translate('edit.server.details.heading', this.state.data.name))}
        <div className='server-details-container'>
          <div className='left-container'>
            <div className='line-item line-heading'>{translate('server.id.prompt')}
              <span className='line-value'>{this.state.data.id}</span>
            </div>
            <div className='line-item line-heading'>{translate('server.name.prompt')}
              <span className='line-value'>{this.state.data.name}</span>
            </div>
            <div className='line-item line-heading'>{translate('server.role.prompt')}
              <span className='line-value'>{this.state.data.role}</span>
            </div>
            <br/>
            <div className='line-item line-heading'>{translate('server.ip.prompt')}
              {this.renderTextInput('ip-addr', 'text', IpV4AddressValidator)}
            </div>
            <div className='line-item line-heading'>{translate('server.mac.prompt')}
              {this.renderTextInput('mac-addr', 'text', MacAddressValidator)}
            </div>
            <div className='line-item line-heading'>{translate('server.group.prompt')}
              {this.renderDropDown('server-group', this.serverGroups, this.handleSelectGroup)}
            </div>
          </div>
          <div className='right-container'>
            <div className='line-item line-heading'>{translate('server.nicmapping.prompt')}
              {this.renderDropDown('nic-mapping', this.nicMappings, this.handleSelectNicMapping)}
            </div>
            <div className='line-item line-heading'>{translate('server.ipmi.ip.prompt')}
              {this.renderTextInput('ilo-ip', 'text', IpV4AddressValidator)}
            </div>
            <div className='line-item line-heading'>{translate('server.ipmi.username.prompt')}
              {this.renderTextInput('ilo-user', 'text')}
            </div>
            <div className='line-item line-heading'>{translate('server.ipmi.password.prompt')}
              {this.renderTextInput('ilo-password', 'password')}
            </div>
          </div>
          <div className='button-container'>
            <ActionButton
              displayLabel={translate('cancel')}
              clickAction={this.handleCancel}/>
            <ActionButton
              isDisabled={!this.state.isFormValid}
              displayLabel={translate('done')}
              clickAction={this.handleDone}/>
          </div>
        </div>
      </div>
    );
  }
}

class ServerTextInput extends Component {
  constructor(props) {
    super(props);
    this.inputName = this.props.inputName;
    this.isValid = false;
    this.state = {
      errorMsg: '',
      inputValue: this.props.inputValue
    };
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
    this.validateInput(this.state.inputValue);
    this.props.updateFormValidity(this.inputName, this.isValid);
  }

  validateInput(val) {
    let retValid = false;

    if(this.props.isRequired) {
      if(val === undefined || val.length === 0) {
        this.isValid = false;
        this.setState({errorMsg: translate('server.input.required.error')});
        return retValid;
      }
    }

    if(this.props.inputValidate) {//have a validator
      let validateObject = this.props.inputValidate(val);
      if (validateObject) {
        if(validateObject.isValid) {
          this.setState({errorMsg: ''});
          this.isValid = true;
          retValid = true;
        }
        else {
          this.setState({
            errorMsg: validateObject.errorMsg
          });
          this.isValid = false;
        }
      }
      else {
        this.setState({errorMsg: translate('server.validator.error')});
        this.isValid = false;
      }
    }
    else {  //don't have validator
      retValid = true;
      this.setState({ errorMsg: ''});
      this.isValid = true;
    }

    return retValid;
  }

  handleInputChange(e) {
    let val = e.target.value;
    let valid = this.validateInput(val);
    this.setState({
      inputValue: val
    });

    this.props.inputAction(e, valid);
  }

  render() {
    let inputType = 'text';
    if(this.props.inputType) {
      inputType = this.props.inputType;
    }
    return (
      <div className='server-detail-input'>
        <input
          required={this.props.isRequired}
          type={inputType} name={this.inputName}
          value={this.state.inputValue}
          onChange={(e) => this.handleInputChange(e)}>
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
    this.handleSelect = this.handleSelect.bind(this);
  }

  handleSelect(e) {
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
          value={this.state.selectedName}
          type="select" onChange={this.handleSelect}>
          {this.renderOptions()}
        </select>
      </div>
    );
  }
}

export default EditServerDetails;
