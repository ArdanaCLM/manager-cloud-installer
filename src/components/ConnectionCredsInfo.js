import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import { ServerInput } from '../components/ServerUtils.js';
import { ActionButton } from '../components/Buttons.js';
import { getAppConfig } from '../components/ConfigHelper.js';
import {
  IpV4AddressHostValidator, PortValidator
} from '../components/InputValidators.js';
import { ErrorMessage } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';

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
    this.errorContent = undefined;

    this.state = {
      isOneViewChecked: false,
      sumaTestStatus: UNKNOWN,
      oneviewTestStatus: UNKNOWN,
      showError: false,
      loading: false
    };
  }

  componentWillMount() {
    this.data =this.makeDeepCopy(this.props.data);
    this.initData();
    this.setState({
      isSumaChecked: this.initSumaCheck()
    });
  }

  initData() {
    //init so we don't need to check too many levels of data defined or undefined
    if(!this.data.suma) {
      this.data.suma = {
        creds: {
          'host': '',
          'username': '',
          'password': '',
          'port': 0
        }
      };
    }
    if(!this.data.oneview) {
      this.data.oneview = {
        creds: {
          'host': '',
          'username': '',
          'password': '',
          'port': 0
        }
      };
    }
  }

  makeDeepCopy(srcData) {
    return JSON.parse(JSON.stringify(srcData));
  }

  initSumaCheck() {
    return (this.data.suma.token !== undefined);
  }

  checkResponse(response) {
    if (!response.ok) {
      throw Error(response.url + ':' + response.statusText);
    }
    return response;
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
    if(this.state.isSumaChecked && this.data.suma.token === undefined) {
      let values = Object.values(this.allInputsStatus.suma);
      isAllValid = this.checkFormValues(values);
    }

    //still valid check oneview creds
    if(isAllValid) {
      if(this.state.isOneViewChecked) {
        let values = Object.values(this.allInputsStatus['oneview']);
        isAllValid = this.checkFormValues(values);
      }
    }
    return isAllValid;
  }

  updateFormValidity = (props, isValid, clearTest) => {
    this.allInputsStatus[props.category][props.inputName] = isValid ? VALID : INVALID;
    if (clearTest) {
      if (props.category === 'suma') {
        this.setState({sumaTestStatus: UNKNOWN});
      }
      else {
        this.setState({oneviewTestStatus: UNKNOWN});
      }
    }
  }

  isDoneDisabled() {
    return (
      !this.isFormValid() ||
      (this.state.isSumaChecked &&
       this.data.suma.token === undefined &&
       this.state.sumaTestStatus <= 0) ||
      (this.state.isOneViewChecked &&
      this.state.oneviewTestStatus <= 0) ||
      (!this.state.isSumaChecked && !this.state.isOneViewChecked)
    );
  }

  isTestDisabled() {
    return (
      !this.isFormValid() ||
      (!this.state.isOneViewChecked && !this.state.isSumaChecked) ||
      (!this.state.isOneViewChecked && this.data.suma.token !== undefined)
    );
  }

  testSuma = () => {
    let promise = new Promise((resolve, reject) => {
      fetch(getAppConfig('shimurl') + '/api/v1/sm/connection_test', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.data.suma.creds)
      })
        .then((response) => this.checkResponse(response))
        .then((response) => response.json())
        .then((tokenKey) => {
          resolve(tokenKey);
          this.setState({sumaTestStatus: VALID});
        })
        .catch((error) => {
          let msg =
            translate(
              'server.test.suma.error', this.data.suma.creds.host, this.data.suma.creds.username);
          let msgContent = {
            messages: [msg, error.toString()]
          };

          if (this.errorContent !== undefined) {
            msgContent.messages = msgContent.messages.concat(this.errorContent.messages);
          }
          this.errorContent = msgContent;
          this.setState({sumaTestStatus: INVALID});
          reject(error);
        })
    });
    return promise;
  }

  handleTest = () => {
    this.setState({showError: false});
    this.errorContent = undefined;
    let promises = [];
    if(this.state.isSumaChecked && this.data.suma.token === undefined) {
      this.setState({loading: true});
      promises.push(this.testSuma())
    }

    //TODO implement
    if(this.state.isOneViewChecked) {
      this.setState({oneviewTestStatus: VALID});
    }

    this.doAllTest(promises)
      .then((tokenKeys) => {
        this.setState({loading: false});
      })
      .catch((error) => {
        this.setState({loading: false, showError: true});
      })
  }

  doAllTest(promises) {
    return Promise.all(promises);
  }

  handleInputChange = (e, isValid, props) => {
    let value = e.target.value;
    this.updateFormValidity(props, isValid, true);
    if (isValid) {
      this.data[props.category]['creds'][props.inputName] = value;
    }
  }

  handleCancel = () => {
    this.props.cancelAction();
  }

  handleDone = () => {
    let retData = {};
    if(this.state.isSumaChecked) {
      if(!this.data.suma.token) {
        retData.suma = this.data.suma;
      }
    }

    if(this.state.isOneViewChecked) {
      retData.oneview = this.data.oneview;
    }

    this.props.doneAction(retData);
  }

  handleSumaCheckBoxChange = (e, data) => {
    this.setState({isSumaChecked: !this.state.isSumaChecked});
  }

  handleOneviewCheckBoxChange = (e, data) => {
    this.setState({isOneViewChecked: !this.state.isOneViewChecked});
  }

  handleCloseMessageAction = () => {
    this.setState({showError: false});
    this.errorContent = undefined;
  }

  renderErrorMessage() {
    return (
      <ErrorMessage
        closeAction={this.handleCloseMessageAction}
        show={this.state.showError} content={this.errorContent}>
      </ErrorMessage>
    );
  }

  renderLoadingMask() {
    return (
      <LoadingMask className='input-modal-mask' show={this.state.loading}></LoadingMask>
    );
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
      let props = {};
      let required = true;
      if(name === 'port') {
        props.min = 0;
        props.max = 65535;
        required = false;
      }
      return (
        <ServerInput
          isRequired={required} inputName={name} inputType={type} {...props}
          category={category} inputValue={this.data[category]['creds'][name]}
          inputAction={this.handleInputChange} updateFormValidity={this.updateFormValidity}>
        </ServerInput>
      );
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
    if(this.data.suma.token) {
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
      return (
        <div className='creds-category'>
          <input
            type='checkbox' value='suma'
            checked={this.state.isSumaChecked}
            onChange={(e) => this.handleSumaCheckBoxChange(e, 'suma')}/>
          {translate('server.suma')}
          {this.state.isSumaChecked && this.renderCredsContent('suma')}
        </div>
      );
    }
  }

  renderOneviewCreds() {
    return (
      <div className='creds-category'>
        <input
          type='checkbox' value='oneview' checked={this.state.isOneViewChecked}
          onChange={(e) => this.handleOneviewCheckBoxChange(e, 'oneview')}/>
        {translate('server.oneview')}
        {this.state.isOneViewChecked && this.renderCredsContent('oneview')}
      </div>
    );
  }

  renderFooter() {
    return (
      <div className='btn-row input-button-container'>
        <ActionButton
          clickAction={this.handleCancel} displayLabel={translate('cancel')}/>
        <ActionButton
          isDisabled={this.isTestDisabled()}
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
        {this.renderLoadingMask()}
        {this.renderErrorMessage()}
      </div>
    );
  }
}

export default ConnectionCredsInfo;
