import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import { ServerInput, ServerInputLine } from '../components/ServerUtils.js';
import { ActionButton } from '../components/Buttons.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import {
  IpV4AddressHostValidator, PortValidator
} from '../utils/InputValidators.js';
import { ErrorMessage, SuccessMessage } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';
import { isEmpty } from 'lodash';

const UNKNOWN = -1;
const VALID = 1;
const INVALID = 0;

const ERROR_MSG = 0;
const SUCCESS_MSG = 1;

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

    this.state = {
      isOvChecked: false,
      isSmChecked: false,
      smTestStatus: UNKNOWN,
      ovTestStatus: UNKNOWN,
      loading: false,

      messages: [],
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
      isAllValid = (values.every((val) => {return val === VALID || val === UNKNOWN;}));
    }

    //still valid check hpe oneview creds
    if(isAllValid) {
      if(this.state.isOvChecked) {
        let values = Object.values(this.allInputsStatus.ov);
        isAllValid = (values.every((val) => {return val === VALID || val === UNKNOWN;}));
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
       this.state.smTestStatus <= 0) ||   // TODO: Avoid using arithmetic on enumerated constants
      (this.state.isOvChecked &&
      this.state.ovTestStatus <= 0) ||    // TODO: Avoid using arithmetic on enumerated constants
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
          let hostport = this.data.sm.creds.host +
            (this.data.sm.creds.port > 0 ? ':'  + this.data.sm.creds.port : '');
          let msg = translate('server.test.sm.success', hostport);

          this.setState(prev => { return {
            messages: prev.messages.concat([{msg: msg, messageType: SUCCESS_MSG}]),
            smTestStatus: VALID
          };});
        })
        .catch((error) => {
          let msg = translate('server.test.sm.error');
          if(error.message === '404') {
            let hostport = this.data.sm.creds.host +
              (this.data.sm.creds.port > 0 ? ':'  + this.data.sm.creds.port : '');
            msg = translate('server.test.sm.error.hostport', hostport);
          }
          else if(error.message === '403') {
            msg = translate('server.test.sm.error.userpass', this.data.sm.creds.username);
          }

          this.setState(prev => { return {
            messages: prev.messages.concat([{msg: msg, messageType: ERROR_MSG}]),
            smTestStatus: INVALID
          };});
          reject(error);
        });
    });
    return promise;
  }

  testOv = () => {
    let promise = new Promise((resolve, reject) => {
      fetch(getAppConfig('shimurl') + '/api/v1/ov/connection_test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.data.ov.creds)
      })
        .then(response => response.json())
        .then((responseData) => {
          if (responseData.sessionID) {
            resolve(responseData);
            this.data.ov.sessionID = responseData.sessionID;
            let msg = translate('server.test.ov.success', this.data.ov.creds.host);
            this.setState(prev => { return {
              messages: prev.messages.concat([{msg: msg, messageType: SUCCESS_MSG}]),
              ovTestStatus: VALID
            };});
          } else {
            let error = responseData.error;
            let msg = translate('server.test.ov.error', this.data.ov.creds.host, error);
            this.setState(prev => { return {
              messages: prev.messages.concat([{msg: msg, messageType: ERROR_MSG}]),
              ovTestStatus: INVALID
            };});
            reject(error);
          }
        })
        .catch((error) => {
          let msg = translate('server.test.ov.error', this.data.ov.creds.host, error);
          this.setState(prev => { return {
            messages: prev.messages.concat([{msg: msg, messageType: ERROR_MSG}]),
            ovTestStatus: INVALID
          };});
          reject(error);
        });
    });
    return promise;
  }

  handleTest = () => {
    this.setState({
      messages: [],
      loading: true
    });

    let promises = [];
    if(this.state.isSmChecked) {
      promises.push(this.testSm());
    }

    if(this.state.isOvChecked) {
      promises.push(this.testOv());
    }

    this.doAllTest(promises)
      .then((tokenKeys) => {
        this.setState({loading: false});
      })
      .catch((error) => {
        this.setState({loading: false});
      });
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

  handleCloseMessage = (ind) => {
    this.setState((prevState) => {
      //for some reason eslint flags 'messages' below as unused even though it clearly is used elsewhere
      messages: prevState.messages.splice(ind, 1); // eslint-disable-line no-unused-labels
    });
  }

  renderMessage() {
    if (! isEmpty(this.state.messages)) {
      let msgList = [];
      this.state.messages.map((msgObj, ind) => {
        if (msgObj.messageType === ERROR_MSG) {
          msgList.push(
            <ErrorMessage key={ind} closeAction={() => this.handleCloseMessage(ind)}
              message={msgObj.msg}/>);
        } else {
          msgList.push(
            <SuccessMessage key={ind} closeAction={() => this.handleCloseMessage(ind)}
              message={msgObj.msg}/>);
        }
      });
      return (
        <div className='notification-message-container'>{msgList}</div>
      );
    }
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
          inputValue={this.data[category]['creds'][name] || ''}
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
          category={category} inputValue={this.data[category]['creds'][name] || ''}
          inputAction={this.handleInputChange} updateFormValidity={this.updateFormValidity}>
        </ServerInput>
      );
    }
  }

  renderInputLine = (title, name, type, category, validate) => {
    return (
      <ServerInputLine label={title} isRequired={true} inputName={name} inputType={type}
        inputValidate={validate} category={category}
        inputValue={this.data[category]['creds'][name] || ''}
        inputAction={this.handleInputChange} updateFormValidity={this.updateFormValidity}/>
    );
  }

  renderCredsOvContent() {
    return (
      <div className='server-details-container'>
        {this.renderInputLine('server.host1.prompt', 'host', 'text', 'ov',
          IpV4AddressHostValidator)}
        {this.renderInputLine('server.user.prompt', 'username', 'text', 'ov')}
        {this.renderInputLine('server.pass.prompt', 'password', 'password', 'ov')}
        <div className='message-line'></div>
      </div>
    );
  }

  renderCredsContent(refType) {
    return (
      <div ref={refType} className='server-details-container'>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.host.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('host', 'text', refType, IpV4AddressHostValidator)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.port.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('port', 'number', refType, PortValidator)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.username.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('username', 'text', refType)}
          </div>
        </div>
        <div className='detail-line'>
          <div className='detail-heading'>{translate('server.password.prompt')}</div>
          <div className='input-body'>
            {this.renderInput('password', 'password', refType)}
          </div>
        </div>
        <div className='message-line'></div>
      </div>
    );
  }

  renderSmCreds() {
    return (
      <div>
        <input className='creds-category' type='checkbox' value='sm'
          checked={this.state.isSmChecked} onChange={(e) => this.handleSmCheckBoxChange(e, 'sm')}/>
        {translate('server.sm')}
        {this.state.isSmChecked && this.renderCredsContent('sm')}
      </div>
    );
  }

  renderOvCreds() {
    return (
      <div>
        <input className='creds-category' type='checkbox' value='ov'
          checked={this.state.isOvChecked} onChange={(e) => this.handleOvCheckBoxChange(e, 'ov')}/>
        {translate('server.ov')}
        {this.state.isOvChecked && this.renderCredsOvContent()}
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
        {this.renderMessage()}
      </div>
    );
  }
}

export default ConnectionCredsInfo;
