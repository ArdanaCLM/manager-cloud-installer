import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import { ServerInput } from '../components/ServerUtils.js';
import { ActionButton } from '../components/Buttons.js';
import { getAppConfig } from '../components/ConfigHelper.js';
import {
  IpV4AddressHostValidator, PortValidator
} from '../components/InputValidators.js';
import { ErrorMessage, SuccessMessage } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';

const UNKNOWN = -1;
const VALID = 1;
const INVALID = 0;

class ConnectionCredsInfo extends Component {
  constructor(props) {
    super(props);

    //check all inputs are valid
    this.allInputsStatus = {
      'sm': {
        'host': UNKNOWN,
        'username': UNKNOWN,
        'password': UNKNOWN,
        'port': UNKNOWN
      },
      'ov': {
        'host': UNKNOWN,
        'username': UNKNOWN,
        'password': UNKNOWN,
        'port': UNKNOWN
      }
    };
    this.errorContent = undefined;
    this.successContent = undefined;

    this.state = {
      isOvChecked: false,
      isSmChecked: false,
      smTestStatus: UNKNOWN,
      ovTestStatus: UNKNOWN,
      showError: false,
      showSuccess: false,
      loading: false
    };
  }

  componentWillMount() {
    this.data = this.makeDeepCopy(this.props.data);
    this.initData();
  }

  initData() {
    //init so we don't need to check too many levels of data defined or undefined
    if(!this.data.sm.creds) {
      this.data.sm = {
        creds: {
          'host': '',
          'username': '',
          'password': '',
          'port': 8443
        }
      };
    }
    if(!this.data.ov.creds) {
      this.data.ov = {
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

  checkResponse(response) {
    if (!response.ok) {
      throw Error(response.status);
    }
    return response;
  }

  isFormValid () {
    let isAllValid = true;
    if(this.state.isSmChecked) {
      let values = Object.values(this.allInputsStatus.sm);
      isAllValid = (values.every((val) => {return val === VALID || val === UNKNOWN}));
    }

    //still valid check hpe oneview creds
    if(isAllValid) {
      if(this.state.isOvChecked) {
        let values = Object.values(this.allInputsStatus.ov);
        isAllValid = (values.every((val) => {return val === VALID || val === UNKNOWN}));
      }
    }
    return isAllValid;
  }

  updateFormValidity = (props, isValid, clearTest) => {
    this.allInputsStatus[props.category][props.inputName] = isValid ? VALID : INVALID;
    if (clearTest) {
      if (props.category === 'sm') {
        this.setState({smTestStatus: UNKNOWN});
      }
      else {
        this.setState({ovTestStatus: UNKNOWN});
      }
    }
  }

  isDoneDisabled() {
    return (
      !this.isFormValid() ||
      (this.state.isSmChecked &&
       this.state.smTestStatus <= 0) ||
      (this.state.isOvChecked &&
      this.state.ovTestStatus <= 0) ||
      (!this.state.isSmChecked && !this.state.isOvChecked)
    );
  }

  isTestDisabled() {
    return (
      !this.isFormValid() ||
      (!this.state.isOvChecked && !this.state.isSmChecked)
    );
  }

  testSm = () => {
    this.data.sm.sessionKey = undefined;
    let promise = new Promise((resolve, reject) => {
      fetch(getAppConfig('shimurl') + '/api/v1/sm/connection_test', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.data.sm.creds)
      })
        .then((response) => this.checkResponse(response))
        .then((response) => response.json())
        .then((tokenKey) => {
          resolve(tokenKey);
          this.data.sm.sessionKey = tokenKey;
          this.setState({smTestStatus: VALID});
          let hostport = this.data.sm.creds.host +
            (this.data.sm.creds.port > 0 ? ':'  + this.data.sm.creds.port : '');
          let msg = translate('server.test.sm.success', hostport);
          let msgContent = {messages: msg.join(' ')};
          if (this.successContent !== undefined) {
            msgContent.messages = msgContent.messages.concat(this.successContent.messages);
          }
          this.successContent = msgContent;
        })
        .catch((error) => {
          let msg = translate('server.test.sm.error');
          if(error.message === '404') {
            let hostport = this.data.sm.creds.host +
              (this.data.sm.creds.port > 0 ? ':'  + this.data.sm.creds.port : '');
            msg = translate('server.test.sm.error.hostport', hostport);
            msg = msg.join(' ');
          }
          else if(error.message === '403') {
            msg = translate('server.test.sm.error.userpass', this.data.sm.creds.username);
            msg = msg.join(' ');
          }

          let msgContent = {messages: msg};

          if (this.errorContent !== undefined) {
            msgContent.messages = msgContent.messages.concat(this.errorContent.messages);
          }
          this.errorContent = msgContent;
          this.setState({smTestStatus: INVALID});
          reject(error);
        })
    });
    return promise;
  }

  handleTest = () => {
    this.setState({showError: false});
    this.errorContent = undefined;
    let promises = [];
    if(this.state.isSmChecked) {
      this.setState({loading: true});
      promises.push(this.testSm())
    }

    //TODO implement
    if(this.state.isOvChecked) {
      this.setState({ovTestStatus: VALID});
    }

    this.doAllTest(promises)
      .then((tokenKeys) => {
        this.setState({loading: false, showSuccess: true});
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
    if(this.state.isSmChecked) {
      retData.sm = this.data.sm;
    }

    if(this.state.isOvChecked) {
      retData.ov = this.data.ov;
    }

    this.props.doneAction(retData);
  }

  handleSmCheckBoxChange = (e, data) => {
    this.setState({isSmChecked: !this.state.isSmChecked});
  }

  handleOvCheckBoxChange = (e, data) => {
    this.setState({isOvChecked: !this.state.isOvChecked});
  }

  handleCloseErrorMessageAction = () => {
    this.setState({showError: false});
    this.errorContent = undefined;
  }

  handleCloseSuccessMessageAction = () => {
    this.setState({showSuccess: false});
    this.successContent = undefined;
  }

  renderErrorMessage() {
    return (
      <ErrorMessage
        closeAction={this.handleCloseErrorMessageAction}
        show={this.state.showError} content={this.errorContent}>
      </ErrorMessage>
    );
  }

  renderSuccessMessage() {
    return (
      <SuccessMessage
        closeAction={this.handleCloseSuccessMessageAction}
        show={this.state.showSuccess} content={this.successContent}>
      </SuccessMessage>
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

  renderSmCreds() {
    return (
      <div className='creds-category'>
        <input
          type='checkbox' value='sm'
          checked={this.state.isSmChecked}
          onChange={(e) => this.handleSmCheckBoxChange(e, 'sm')}/>
        {translate('server.sm')}
        {this.state.isSmChecked && this.renderCredsContent('sm')}
      </div>
    );
  }

  renderOvCreds() {
    return (
      <div className='creds-category'>
        <input
          type='checkbox' value='ov' checked={this.state.isOvChecked}
          onChange={(e) => this.handleOvCheckBoxChange(e, 'ov')}/>
        {translate('server.ov')}
        {this.state.isOvChecked && this.renderCredsContent('ov')}
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
        {this.renderSmCreds()}
        {this.renderOvCreds()}
        {this.renderFooter()}
        {this.renderLoadingMask()}
        {this.renderErrorMessage()}
        {this.renderSuccessMessage()}
      </div>
    );
  }
}

export default ConnectionCredsInfo;
