// (c) Copyright 2017 SUSE LLC
import React, { Component } from 'react';
import { translate } from '../../localization/localize.js';
import { ActionButton } from '../../components/Buttons.js';
import { ServerInputLine, ServerDropdownLine} from '../../components/ServerUtils.js';
import { IpV4AddressValidator, MacAddressValidator } from '../../utils/InputValidators.js';
import { INPUT_STATUS } from '../../utils/constants.js';

class EditServerDetails extends Component {
  constructor(props) {
    super(props);

    this.nicMappings = this.props.nicMappings;
    this.serverGroups = this.props.serverGroups;
    this.allInputsStatus = {
      'ip-addr': INPUT_STATUS.UNKNOWN,
      'ilo-user': INPUT_STATUS.UNKNOWN,
      'ilo-password': INPUT_STATUS.UNKNOWN,
      'ilo-ip': INPUT_STATUS.UNKNOWN,
      'mac-addr': INPUT_STATUS.UNKNOWN
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
    isAllValid =
      (values.every((val) => {return val === INPUT_STATUS.VALID || val === INPUT_STATUS.UNKNOWN;}));

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
    this.allInputsStatus[props.inputName] = isValid ? INPUT_STATUS.VALID : INPUT_STATUS.INVALID;
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

  renderInput(name, type, isRequired, title, validate) {
    return (
      <ServerInputLine
        isRequired={isRequired} inputName={name} inputType={type} label={title}
        inputValidate={validate} inputValue={this.data[name]}
        inputAction={this.handleInputChange} updateFormValidity={this.updateFormValidity}/>
    );
  }

  renderDropDown(name, list, handler, isRequired, title) {
    let emptyOptProps = '';
    if(this.data[name] === '' || this.data[name] === undefined) {
      emptyOptProps = {
        label: translate('server.please.select'),
        value: 'noopt'
      };
    }
    return (
      <ServerDropdownLine label={title} value={this.data[name]} optionList={list}
        isRequired={isRequired} emptyOption={emptyOptProps} selectAction={handler}/>
    );
  }

  renderTextLine(title, value) {
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{translate(title)}</div>
        <div className='info-body'>{value}</div>
      </div>
    );
  }

  renderServerContent() {
    return (
      <div>
        <div className='server-details-container'>
          {this.renderTextLine('server.id.prompt', this.data.id)}
          {this.renderTextLine('server.name.prompt', this.data.name)}
          {this.renderTextLine('server.role.prompt', this.data.role)}
          {this.renderInput('ip-addr', 'text', true, 'server.ip.prompt', IpV4AddressValidator)}
          {this.renderDropDown('server-group', this.serverGroups, this.handleSelectGroup, true,
            'server.group.prompt')}
          {this.renderDropDown('nic-mapping', this.nicMappings, this.handleSelectNicMapping, true,
            'server.nicmapping.prompt')}
        </div>
        <div className='message-line'>{translate('server.ipmi.message')}</div>
        <div className='server-details-container'>
          {this.renderInput('mac-addr', 'text', false, 'server.mac.prompt', MacAddressValidator)}
          {this.renderInput('ilo-ip', 'text', false, 'server.ipmi.ip.prompt',IpV4AddressValidator)}
          {this.renderInput('ilo-user', 'text', false, 'server.ipmi.username.prompt')}
          {this.renderInput('ilo-password', 'password', false, 'server.ipmi.password.prompt')}
        </div>
      </div>
    );
  }

  renderFooter() {
    return (
      <div className='btn-row input-button-container'>
        <ActionButton type='default'
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
