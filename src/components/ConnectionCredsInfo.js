import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import { ServerInput } from '../components/ServerUtils.js';
import { ActionButton } from '../components/Buttons.js';

import {
  IpV4AddressHostValidator, PortValidator
} from '../components/InputValidators.js';

const UNKNOWN = -1;
const VALID = 1;
const INVALID = 0;

class ConnectionCredsInfo extends Component {

  constructor(props) {
    super(props);

    //check all inputs are valid
    this.allInputsStatus = {
      'suma': {
        'host': UNKNOWN,
        'username': UNKNOWN,
        'password': UNKNOWN,
        'port': UNKNOWN
      },
      'oneview': {
        'host': UNKNOWN,
        'username': UNKNOWN,
        'password': UNKNOWN,
        'port': UNKNOWN
      }
    };

    //check if test pass or not
    this.testStatus = {
      'suma': UNKNOWN,
      'oneview': UNKNOWN
    };

    this.state = {
      isFormValid: false,
      isOneViewChecked: false
    };

    this.updateFormValidity = this.updateFormValidity.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSumaCheckBoxChange = this.handleSumaCheckBoxChange.bind(this);
    this.handleOneviewCheckBoxChange = this.handleOneviewCheckBoxChange.bind(this);
    this.handleDone = this.handleDone.bind(this);
    this.handleTest = this.handleTest.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  componentWillMount() {
    this.setState({
      isSumaChecked: this.initSumaCheck()
    });
    this.data =this.makeDeepCopy(this.props.data);
  }

  makeDeepCopy(srcData) {
    return JSON.parse(JSON.stringify(srcData));
  }

  initSumaCheck() {
    if(this.props.data &&
      this.props.data.suma &&
      this.props.data.suma.token) {
      return true;
    }
    return false;
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

  setFormValidity() {
    let isAllValid = true;
    if(this.state.isSumaChecked && this.data.suma.token === undefined) {
      let values = Object.values(this.allInputsStatus['suma']);
      isAllValid = this.checkFormValues(values);
    }

    //still valid check oneview creds
    if(isAllValid) {
      if(this.state.isOneViewChecked) {
        let values = Object.values(this.allInputsStatus['oneview']);
        isAllValid = this.checkFormValues(values);
      }
    }
    //use this to enable and disable done button
    this.setState({isFormValid: isAllValid});
  }

  updateFormValidity(props, isValid) {
    this.allInputsStatus[props.category][props.inputName] = isValid ? VALID : INVALID;
    this.testStatus[props.category] = UNKNOWN;
    this.setFormValidity();
  }

  isDoneDisabled() {
    if(!this.state.isFormValid ||
      (this.state.isSumaChecked &&
       this.data.suma.token === undefined &&
       this.testStatus.suma <= 0) ||
      (this.state.isOneViewChecked &&
      this.testStatus.oneview <=0)) {
      return true;
    }
    return false;
  }

  isTestDisabled() {
    if(!this.state.isFormValid ||
      (!this.state.isOneViewChecked && !this.state.isSumaChecked) ||
      (!this.state.isOneViewChecked && this.data.suma.token !== undefined)) {
      return true;
    }

    return false;
  }

  handleInputChange(e, isValid, props) {
    let value = e.target.value;
    this.updateFormValidity(props, isValid);
    if (isValid) {
      this.data[props.category]['creds'][props.inputName] = value;
    }
  }

  handleTest() {
    //TODO
    if(this.state.isSumaChecked && this.data.suma.token === undefined) {
      //call backend once it comes back
      //TODO need implemnt backend to do actual test
      //TODO need implement loading mask
      //error toast message
      this.testStatus.suma = VALID;
    }

    if(this.state.isOneViewChecked) {
      this.testStatus.oneview = VALID;
    }

    this.setFormValidity();
  }

  handleCancel() {
    this.props.cancelAction();
  }

  handleDone() {
    let retData = {};
    if(this.state.isSumaChecked) {
      if(!this.data.suma.token) {
        retData.suma = this.data.suma;
        retData.suma.creds.password = '';
      }
    }

    if(this.state.isOneViewChecked) {
      retData.oneview = this.data.oneview;
      retData.oneview.creds.password = '';
    }

    this.props.doneAction(retData);
  }

  handleSumaCheckBoxChange(e, data) {
    if(!this.state.isSumaChecked) {
      this.data.suma.creds.password = '';
    }

    this.setState({isSumaChecked: !this.state.isSumaChecked});
    //clear up the validation
    let keys = Object.keys(this.allInputsStatus.suma);
    keys.forEach((key) => {
      this.allInputsStatus.suma[key] = UNKNOWN;
    });
    //reset test status
    this.testStatus.suma = UNKNOWN;
  }

  handleOneviewCheckBoxChange(e, data) {
    this.setState({isOneViewChecked: !this.state.isOneViewChecked});
    //clear up the validation
    let keys = Object.keys(this.allInputsStatus.oneview);
    keys.forEach((key) => {
      this.allInputsStatus.oneview[key] = UNKNOWN;
    });
    //reset test status
    this.testStatus.oneview = UNKNOWN;
  }

  renderInput(name, type, category, validate) {
    if(validate) {
      return (
        <ServerInput
          isRequired={true} inputName={name} inputType={type}
          inputValidate={validate} category={category}
          inputValue={this.data[category]['creds'][name]}
          inputAction={this.handleInputChange} updateFormValidity={this.updateFormValidity}>
        </ServerInput>
      );
    }
    else {
      if(name === 'port') {
        return (
          <ServerInput
            isRequired={false} inputName={name} inputType={type} min={0} max={65535}
            category={category} inputValue={this.data[category]['creds'][name]}
            inputAction={this.handleInputChange} updateFormValidity={this.updateFormValidity}>
          </ServerInput>
        );
      }
      else {
        return (
          <ServerInput
            isRequired={true} inputName={name} inputType={type}
            category={category} inputValue={this.data[category]['creds'][name]}
            inputAction={this.handleInputChange} updateFormValidity={this.updateFormValidity}>
          </ServerInput>
        );
      }
    }
  }

  renderCredsContent(refType) {
    return (
      <div ref={refType} className='input-container'>
        <div className='input-line'>
          <div className='input-heading'>{translate('server.host.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('host', 'text', refType, IpV4AddressHostValidator)}
          </div>
        </div>
        <div className='input-line'>
          <div className='input-heading'>{translate('server.port.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('port', 'number', refType, PortValidator)}
          </div>
        </div>
        <div className='input-line'>
          <div className='input-heading'>{translate('server.username.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('username', 'text', refType)}
          </div>
        </div>
        <div className='input-line'>
          <div className='input-heading'>{translate('server.password.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('password', 'password', refType)}
          </div>
        </div>
      </div>
    );
  }

  renderSumaCreds() {
    //have suma token don't need creds inputs
    if(this.data.suma && this.data.suma.token) {
      return (
        <div className='creds-category'>
          <input
            type='checkbox' value='suma'
            checked={this.state.isSumaChecked}
            disabled
            onChange={(e) => this.handleSumaCheckBoxChange(e, 'suma')}/>
          {translate('server.suma')}
        </div>
      );
    }
    else { //don't have suma token
      if(this.state.isSumaChecked) {
        return (
          <div className='creds-category'>
            <input
              type='checkbox' value='suma'
              checked={this.state.isSumaChecked}
              onChange={(e) => this.handleSumaCheckBoxChange(e, 'suma')}/>
            {translate('server.suma')}
            {this.renderCredsContent('suma')}
          </div>
        );
      }
      else { //if not checked don't show the creds inputs
        return (
          <div className='creds-category'>
            <input
              type='checkbox' value='suma'
              checked={this.state.isSumaChecked}
              onChange={(e) => this.handleSumaCheckBoxChange(e, 'suma')}/>
            {translate('server.suma')}
          </div>
        );
      }
    }
  }

  renderOneviewCreds() {
    if(this.state.isOneViewChecked) {
      return (
        <div className='creds-category'>
          <input
            type='checkbox' value='oneview' checked={this.state.isOneViewChecked}
            onChange={(e) => this.handleOneviewCheckBoxChange(e, 'oneview')}/>
          {translate('server.oneview')}
          {this.renderCredsContent('oneview')}
        </div>
      );
    }
    else { //if not checked don't show the creds inputs
      return (
        <div className='creds-category'>
          <input
            type='checkbox' value='oneview' checked={this.state.isOneViewChecked}
            onChange={(e) => this.handleOneviewCheckBoxChange(e, 'oneview')}/>
          {translate('server.oneview')}
        </div>
      );
    }
  }

  renderFooter() {
    return (
      <div className='input-button-container'>
        <ActionButton
          hasNext
          clickAction={this.handleCancel} displayLabel={translate('cancel')}/>
        <ActionButton
          hasNext isDisabled={this.isTestDisabled()}
          clickAction={this.handleTest} displayLabel={translate('test')}/>
        <ActionButton
          isDisabled={this.isDoneDisabled()}
          clickAction={this.handleDone} displayLabel={translate('done')}/>
      </div>
    );
  }

  render() {
    return (
      <div className='connection-creds-info'>
        {this.renderSumaCreds()}
        {this.renderOneviewCreds()}
        {this.renderFooter()}
      </div>
    );
  }
}

export default ConnectionCredsInfo;
