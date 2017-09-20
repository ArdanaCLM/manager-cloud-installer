import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import { ActionButton } from './Buttons.js';
import { ServerInput, ServerDropdown} from '../components/ServerUtils.js';
import {
  IpV4AddressValidator, MacAddressValidator
} from '../utils/InputValidators.js';

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

    this.data = this.makeDeepCopy(this.props.data);
    this.state = {isFormValid: false};
  }

  makeDeepCopy(srcData) {
    return JSON.parse(JSON.stringify(srcData));
  }

  isFormTextInputValid() {
    let isAllValid = true;
    let values = Object.values(this.allInputsStatus);
    isAllValid = (values.every((val) => {return val === VALID || val === UNKNOWN}));

    return isAllValid;
  }

  isFormDropdownValid() {
    let isValid = true;
    if(this.data['server-group'] === '' ||
    this.data['server-group'] === undefined ||
    this.data['server-group'] === 'noopt') {
      isValid = false;
    }

    if(isValid) {
      if(this.data['nic-mapping'] === '' ||
      this.data['nic-mapping'] === undefined ||
      this.data['nic-mapping'] === 'noopt') {
        isValid = false;
      }
    }
    return isValid;
  }

  updateFormValidity = (props, isValid) => {
    this.allInputsStatus[props.inputName] = isValid ? VALID : INVALID;
    this.setState({isFormValid: this.isFormTextInputValid() && this.isFormDropdownValid()});
  }

  handleDone = () => {
    this.props.doneAction(this.data);
  }

  handleCancel = () => {
    this.props.cancelAction();
  }

  handleSelectGroup = (groupName) => {
    this.data['server-group'] = groupName;
    this.setState({isFormValid: this.isFormTextInputValid() && this.isFormDropdownValid()});
  }

  handleSelectNicMapping = (nicMapName) => {
    this.data['nic-mapping'] = nicMapName;
    this.setState({isFormValid: this.isFormTextInputValid() && this.isFormDropdownValid()});
  }

  handleInputChange = (e, isValid, props) => {
    let value = e.target.value;
    this.updateFormValidity(props, isValid);
    if (isValid) {
      this.data[props.inputName] = value;
    }
  }

  renderInput(name, type, isRequired, validate) {
    if(validate) {
      return (
        <ServerInput
          isRequired={isRequired} inputName={name} inputType={type}
          inputValidate={validate} inputValue={this.data[name]}
          inputAction={this.handleInputChange} updateFormValidity={this.updateFormValidity}>
        </ServerInput>
      );
    }
    else {
      return (
        <ServerInput
          isRequired={isRequired} inputName={name} inputType={type}
          inputValue={this.data[name]} updateFormValidity={this.updateFormValidity}
          inputAction={this.handleInputChange}>
        </ServerInput>
      );
    }
  }

  renderDropDown(name, list, handler) {
    return (
      <ServerDropdown
        value={this.data[name]}
        optionList={list}
        selectAction={handler}>
      </ServerDropdown>
    );
  }

  renderServerContent() {
    let groupTitle = translate('server.group.prompt') + '*';
    let nicMappingTitle = translate('server.nicmapping.prompt') + '*';

    return (
      <div>
      <div className='server-details-container'>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.id.prompt')}</div>
          <div className='info-body'>{this.data.id}</div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.name.prompt')}</div>
          <div className='info-body'>{this.data.name}</div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.role.prompt')}</div>
          <div className='info-body'>{this.data.role}</div>
        </div>

        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.ip.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('ip-addr', 'text', true, IpV4AddressValidator)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{groupTitle}</div>
          <div className='input-body'>
            {this.renderDropDown('server-group', this.serverGroups, this.handleSelectGroup)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{nicMappingTitle}</div>
          <div className='input-body'>
            {this.renderDropDown('nic-mapping', this.nicMappings, this.handleSelectNicMapping)}
          </div>
        </div>
      </div>
        <div className='message-line'>{translate('server.ilo.message')}</div>
      <div className='server-details-container'>
         <div className='detail-line'>
          <div className='detail-heading'>{translate('server.mac.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('mac-addr', 'text', false, MacAddressValidator)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.ipmi.ip.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('ilo-ip', 'text', false, IpV4AddressValidator)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.ipmi.username.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('ilo-user', 'text', false)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.ipmi.password.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('ilo-password', 'password', false)}
          </div>
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
    return (
      <div className='edit-server-details'>
        {this.renderServerContent()}
        {this.renderFooter()}
      </div>
    );
  }
}

export default EditServerDetails;
