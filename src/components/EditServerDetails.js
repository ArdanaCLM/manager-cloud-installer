import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import { ActionButton } from './Buttons.js';
import { ServerInput, ServerDropDown } from '../components/ServerUtils.js';
import {
  IpV4AddressValidator, MacAddressValidator
} from '../components/InputValidators.js';

const UNKNOWN = -1;
const VALID = 1;
const INVALID = 0;

class EditServerDetails extends Component {
  constructor(props) {
    super(props);

    this.nicMappings = this.props.nicMappings;
    this.serverGroups = this.props.serverGroups;
    this.allInputsStatus = {
      'ip-addr': UNKNOWN,
      'ilo-user': UNKNOWN,
      'ilo-password': UNKNOWN,
      'ilo-ip': UNKNOWN,
      'mac-addr': UNKNOWN
    };

    this.state = {
      data: this.makeDeepCopy(this.props.data),
      isFormValid: false
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      data : newProps.data
    });
  }

  makeDeepCopy(srcData) {
    return JSON.parse(JSON.stringify(srcData));
  }

  checkFormValues (values) {
    let isValid = true;
    let val = values.find((val) => {
      return val <= 0;
    });

    if(val <= 0) {
      isValid = false;
    }

    return isValid;
  }

  isFormValid () {
    let isAllValid = true;
    let values = Object.values(this.allInputsStatus);
    isAllValid = this.checkFormValues(values);

    return isAllValid;
  }

  updateFormValidity = (props, isValid) => {
    this.allInputsStatus[props.inputName] = isValid ? VALID : INVALID;
    this.setState({isFormValid: this.isFormValid()})
  }

  handleDone = () => {
    this.props.doneAction(this.state.data);
  }

  handleCancel = () => {
    this.props.cancelAction();
  }

  handleSelectGroup = (groupName) => {
    this.state.data['server-group'] = groupName;
  }

  handleSelectNicMapping = (nicMapName) => {
    this.state.data['nic-mapping'] = nicMapName;
  }

  handleInputChange = (e, isValid, props) => {
    let value = e.target.value;
    this.updateFormValidity(props, isValid);
    if (isValid) {
      this.data[props.inputName] = value;
    }
  }

  renderInput(name, type, validate) {
    if(validate) {
      return (
        <ServerInput
          isRequired={true} inputName={name} inputType={type}
          inputValidate={validate} inputValue={this.state.data[name]}
          inputAction={this.handleInputChange} updateFormValidity={this.updateFormValidity}>
        </ServerInput>
      );
    }
    else {
      return (
        <ServerInput
          isRequired={true} inputName={name} inputType={type}
          inputValue={this.state.data[name]} updateFormValidity={this.updateFormValidity}
          inputAction={this.handleInputChange}>
        </ServerInput>
      );
    }
  }

  renderDropDown(name, list, handler) {
    return (
      <ServerDropDown
        value={this.state.data[name]}
        optionList={list}
        selectAction={handler}>
      </ServerDropDown>
    );
  }

  renderServerContent() {
    return (
      <div className='server-details-container'>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.id.prompt')}</div>
          <div className='info-body'>{this.state.data.id}</div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.name.prompt')}</div>
          <div className='info-body'>{this.state.data.name}</div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.role.prompt')}</div>
          <div className='info-body'>{this.state.data.role}</div>
        </div>

        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.ip.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('ip-addr', 'text', IpV4AddressValidator)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.mac.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('mac-addr', 'text', MacAddressValidator)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.group.prompt')}</div>
          <div className='input-body'>
            {this.renderDropDown('server-group', this.serverGroups, this.handleSelectGroup)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.nicmapping.prompt')}</div>
          <div className='input-body'>
            {this.renderDropDown('nic-mapping', this.nicMappings, this.handleSelectNicMapping)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.ipmi.ip.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('ilo-ip', 'text', IpV4AddressValidator)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.ipmi.username.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('ilo-user', 'text')}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.ipmi.password.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('ilo-password', 'password')}
          </div>
        </div>
      </div>
    );
  }

  renderFooter() {
    return (
      <div className='btn-row input-button-container'>
        <ActionButton
          clickAction={this.handleCancel} displayLabel={translate('cancel')}/>
        <ActionButton
          isDisabled={!this.state.isFormValid}
          clickAction={this.handleDone} displayLabel={translate('done')}/>
      </div>
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
      <div className='edit-server-details'>
        {this.renderServerContent()}
        {this.renderFooter()}
      </div>
    );
  }
}

export default EditServerDetails;
