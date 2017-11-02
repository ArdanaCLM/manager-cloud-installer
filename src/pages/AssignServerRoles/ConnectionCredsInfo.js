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
import { translate } from '../../localization/localize.js';
import { ServerInputLine } from '../../components/ServerUtils.js';
import { ActionButton, ItemHelpButton } from '../../components/Buttons.js';
import { getAppConfig } from '../../utils/ConfigHelper.js';
import {
  IpV4AddressHostValidator, PortValidator
} from '../../utils/InputValidators.js';
import { ErrorMessage, SuccessMessage } from '../../components/Messages.js';
import { LoadingMask } from '../../components/LoadingMask.js';
import { isEmpty } from 'lodash';
import { INPUT_STATUS } from '../../utils/constants.js';

const TEST_STATUS = INPUT_STATUS;

const ERROR_MSG = 0;
const SUCCESS_MSG = 1;

class ConnectionCredsInfo extends Component {
  constructor(props) {
    super(props);

    //check all inputs are valid
    this.allInputsStatus = {
      'sm': {
        'host': INPUT_STATUS.UNKNOWN,
        'username': INPUT_STATUS.UNKNOWN,
        'password': INPUT_STATUS.UNKNOWN,
        'port': INPUT_STATUS.UNKNOWN
      },
      'ov': {
        'host': INPUT_STATUS.UNKNOWN,
        'username': INPUT_STATUS.UNKNOWN,
        'password': INPUT_STATUS.UNKNOWN,
        'port': INPUT_STATUS.UNKNOWN
      }
    };

    this.state = {
      isOvChecked: !!(this.props.data.ov && this.props.data.ov.checked),
      isSmChecked: !!(this.props.data.sm && this.props.data.sm.checked),
      isOvSecured: !!(this.props.data.ov && this.props.data.ov.secured),
      isSmSecured: !!(this.props.data.sm && this.props.data.sm.secured),
      smTestStatus: TEST_STATUS.UNKNOWN,
      ovTestStatus: TEST_STATUS.UNKNOWN,
      loading: false,

      messages: []
    };
  }

  componentWillMount() {
    this.data = this.makeDeepCopy(this.props.data);
    this.initData();
  }

  initData() {
    //init so we don't need to check too many levels of data defined or undefined
    if(!this.data.sm.creds) {
      this.data.sm.creds = {
        'host': '',
        'username': '',
        'password': '',
        'port': 8443,
        'secured': true
      };
    }
    if(!this.data.ov.creds) {
      this.data.ov.creds = {
        'host': '',
        'username': '',
        'password': '',
        'secured': true
      };
    }
  }

  makeDeepCopy(srcData) {
    return JSON.parse(JSON.stringify(srcData));
  }

  isFormValid () {
    let isAllValid = true;
    if(this.state.isSmChecked) {
      let values = Object.values(this.allInputsStatus.sm);
      isAllValid = (values.every((val) => {return val === INPUT_STATUS.VALID || val === INPUT_STATUS.UNKNOWN;}));
    }

    //still valid check hpe oneview creds
    if(isAllValid) {
      if(this.state.isOvChecked) {
        let values = Object.values(this.allInputsStatus.ov);
        isAllValid = (values.every((val) => {return val === INPUT_STATUS.VALID || val === INPUT_STATUS.UNKNOWN;}));
      }
    }
    return isAllValid;
  }

  updateFormValidity = (props, isValid, clearTest) => {
    this.allInputsStatus[props.category][props.inputName] = isValid ? INPUT_STATUS.VALID : INPUT_STATUS.INVALID;
    if (clearTest) {
      if (props.category === 'sm') {
        this.setState({smTestStatus: TEST_STATUS.UNKNOWN});
      }
      else {
        this.setState({ovTestStatus: TEST_STATUS.UNKNOWN});
      }
    }
  }

  isDoneDisabled() {
    return (
      !this.isFormValid() ||
      (this.state.isSmChecked &&
        (this.state.smTestStatus === TEST_STATUS.UNKNOWN || this.state.smTestStatus === TEST_STATUS.INVALID)) ||
      (this.state.isOvChecked &&
        (this.state.ovTestStatus === TEST_STATUS.UNKNOWN || this.state.ovTestStatus === TEST_STATUS.INVALID)) ||
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
    let status = 200;
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/sm/connection_test', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Secured': this.state.isSmSecured
        },
        body: JSON.stringify(this.data.sm.creds)
      })
        .then((response) => {status = response.status; return response.json();})
        .then((responseData) => {
          if(!responseData.error) {
            this.data.sm.sessionKey = responseData;
            let hostport = this.data.sm.creds.host +
              (this.data.sm.creds.port > 0 ? ':' + this.data.sm.creds.port : '');
            let msg = translate('server.test.sm.success', hostport);

            this.setState(prev => {
              return {
                messages: prev.messages.concat([{msg: msg, messageType: SUCCESS_MSG}]),
                smTestStatus: TEST_STATUS.VALID
              };
            });
            Promise.resolve(responseData);
          }
          else {
            let hostport = this.data.sm.creds.host +
                (this.data.sm.creds.port > 0 ? ':'  + this.data.sm.creds.port : '');
            let msg = translate('server.test.sm.error', hostport);
            if(status === 404) {
              msg = translate('server.test.sm.error.hostport', hostport);
            }
            else if(status === 401) {
              msg = translate('server.test.sm.error.userpass', hostport, this.data.sm.creds.username);
            }
            else if(status === 403) {
              msg = translate('server.test.sm.error.secured', hostport);
            }
            this.setState(prev => { return {
              messages: prev.messages.concat([{msg: [msg, responseData.error], messageType: ERROR_MSG}]),
              smTestStatus: TEST_STATUS.INVALID
            };});
            Promise.reject(responseData.error);
          }
        })
        .catch((error) => {
          let hostport = this.data.sm.creds.host +
                (this.data.sm.creds.port > 0 ? ':'  + this.data.sm.creds.port : '');
          let msg = translate('server.test.sm.error', hostport);

          this.setState(prev => { return {
            messages: prev.messages.concat([{msg: [msg, error.toString()], messageType: ERROR_MSG}]),
            smTestStatus: TEST_STATUS.INVALID
          };});
          Promise.reject(error);
        })
    );
  }

  testOv = () => {
    this.data.ov.sessionKey = undefined;
    return (
      fetch(getAppConfig('shimurl') + '/api/v1/ov/connection_test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Secured': this.state.isOvSecured
        },
        body: JSON.stringify(this.data.ov.creds)
      })
        .then(response => response.json())
        .then((responseData) => {
          if (responseData.sessionID) {
            this.data.ov.sessionKey = responseData.sessionID;
            let msg = translate('server.test.ov.success', this.data.ov.creds.host);
            this.setState(prev => { return {
              messages: prev.messages.concat([{msg: msg, messageType: SUCCESS_MSG}]),
              ovTestStatus: TEST_STATUS.VALID
            };});
            Promise.resolve(responseData);
          } else {
            let error = responseData.error;
            let msg = translate('server.test.ov.error', this.data.ov.creds.host);
            this.setState(prev => { return {
              messages: prev.messages.concat([{msg: [msg, error], messageType: ERROR_MSG}]),
              ovTestStatus: TEST_STATUS.INVALID
            };});
            Promise.reject(error);
          }
        })
        .catch((error) => {
          let msg = translate('server.test.ov.error', this.data.ov.creds.host, error);
          this.setState(prev => { return {
            messages: prev.messages.concat([{msg: msg, messageType: ERROR_MSG}]),
            ovTestStatus: TEST_STATUS.INVALID
          };});
          Promise.reject(error);
        })
    );
  }

  handleTest = () => {
    this.setState({
      messages: [],
      loading: true
    });

    let tests = [];
    if(this.state.isSmChecked) {
      tests.push(this.testSm());
    }

    if(this.state.isOvChecked) {
      tests.push(this.testOv());
    }

    this.doAllTest(tests)
      .then((tokenKeys) => {
        this.setState({loading: false});
      })
      .catch((error) => {
        this.setState({loading: false});
      });
  }

  doAllTest(tests) {
    return Promise.all(tests);
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
    let retData = this.data;
    retData.sm.checked = this.state.isSmChecked;
    retData.ov.checked = this.state.isOvChecked;
    retData.sm.secured = this.state.isSmSecured;
    retData.ov.secured = this.state.isOvSecured;

    this.props.doneAction(retData);
  }

  handleSmCheckBoxChange = () => {
    this.setState({isSmChecked: !this.state.isSmChecked});
  }

  handleOvCheckBoxChange = () => {
    this.setState({isOvChecked: !this.state.isOvChecked});
  }

  handleSmSecuredChange = () => {
    this.setState({isSmSecured: !this.state.isSmSecured});
  }

  handleOvSecuredChange = () => {
    this.setState({isOvSecured: !this.state.isOvSecured});
  }

  handleCloseMessage = (ind) => {
    this.setState((prevState) => {
      //for some reason eslint flags 'messages' below as unused even though it clearly is used elsewhere
      messages: prevState.messages.splice(ind, 1); // eslint-disable-line no-unused-labels
    });
  }

  handleShowSslHelp = (type) => {
    if(type === 'sm') {
      //TODO proper doc link
      window.open('https://www.suse.com/documentation/suse-manager-3/singlehtml' +
        '/suse_manager21/book_susemanager_clientconf/book_susemanager_clientconf.html#s1-certificate-rpms');
    }
    else {
      //TODO proper doc link
      window.open('https://www.hpe.com/h20195/v2/default.aspx?cc=us&lc=en&oid=5410258');
    }
  }

  renderMessage() {
    if (!isEmpty(this.state.messages)) {
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

  renderInputLine = (title, name, type, category, validate) => {
    let theprops = {};
    let required = true;
    if(name === 'port') {
      theprops.min = 0;
      theprops.max = 65535;
      required = false;
    }
    return (
      <ServerInputLine label={title} isRequired={required} inputName={name} inputType={type}
        inputValidate={validate} category={category} {...theprops}
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
        <input className='secured' type='checkbox' value='ovsecured'
          checked={this.state.isOvSecured} onChange={this.handleOvSecuredChange}/>
        {translate('server.secure')}
        <ItemHelpButton clickAction={(e) => this.handleShowSslHelp('ov')}/>
        <div className='message-line'></div>
      </div>
    );
  }

  renderCredsSmContent() {
    return (
      <div className='server-details-container'>
        {this.renderInputLine('server.host1.prompt', 'host', 'text', 'sm',
          IpV4AddressHostValidator)}
        {this.renderInputLine('server.port.prompt', 'port', 'number', 'sm', PortValidator)}
        {this.renderInputLine('server.user.prompt', 'username', 'text', 'sm')}
        {this.renderInputLine('server.pass.prompt', 'password', 'password', 'sm')}
        <input className='secured' type='checkbox' value='smsecured'
          checked={this.state.isSmSecured} onChange={this.handleSmSecuredChange}/>
        {translate('server.secure')}
        <ItemHelpButton clickAction={(e) => this.handleShowSslHelp('sm')}/>
        <div className='message-line'></div>
      </div>
    );
  }

  renderSmCreds() {
    return (
      <div>
        <input className='creds-category' type='checkbox' value='sm'
          checked={this.state.isSmChecked} onChange={this.handleSmCheckBoxChange}/>
        {translate('server.sm')}
        {this.state.isSmChecked && this.renderCredsSmContent()}
      </div>
    );
  }

  renderOvCreds() {
    return (
      <div>
        <input className='creds-category' type='checkbox' value='ov'
          checked={this.state.isOvChecked} onChange={this.handleOvCheckBoxChange}/>
        {translate('server.ov')}
        {this.state.isOvChecked && this.renderCredsOvContent()}
      </div>
    );
  }

  renderFooter() {
    return (
      <div className='btn-row input-button-container'>
        <ActionButton type='default'
          clickAction={this.handleCancel} displayLabel={translate('cancel')}/>
        <ActionButton type='default'
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
