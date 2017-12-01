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

import { translate } from '../localization/localize.js';
import { fetchJson, postJson } from '../utils/RestUtils.js';
import { YamlValidator } from '../utils/InputValidators.js';
import { ActionButton } from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';
import { ServerInput } from '../components/ServerUtils.js';
import { Tabs, Tab } from 'react-bootstrap';
import ServiceTemplatesTab from './ValidateConfigFiles/ServiceTemplatesTab.js';
import Dropdown from '../components/Dropdown.js';
import HelpText from '../components/HelpText.js';

const INVALID = 0;
const VALID = 1;
const UNKNOWN = -1;
const VALIDATING = 2;
const VALID_ICON = require('../images/Checked-48.png');
const INVALID_ICON = require('../images/Cancel-48.png');

const TAB = {
  MODEL_FILES: 'MODEL_FILES',
  TEMPLATE_FILES: 'TEMPLATE_FILES',
  CONFIG_FORM: 'CONFIG_FORM'
};

class EditFile extends Component {

  constructor(props) {
    super(props);
    this.state = {
      contents : '',
      isValid: true
    };
  }

  componentWillMount() {
    fetchJson('/api/v1/clm/model/files/' + this.props.file.name)
      .then((response) => {
        this.setState({contents: response});
      });
  }

  handleDone = () => {
    this.props.setChanged();
    this.props.doneEditingFile();

    postJson('/api/v1/clm/model/files/' + this.props.file.name, JSON.stringify(this.state.contents))
      .then(() => this.props.loadModel());
  }

  handleCancel() {
    this.props.doneEditingFile();
  }

  handleChange = (e, valid) => {
    const value = e.target.value;
    this.setState({
      contents: value,
      isValid: valid
    });
  }

  render() {
    return (

      <div>
        <h3>{this.props.file.name}</h3>
        <div className="file-editor">
          <ServerInput
            inputValue={this.state.contents}
            inputName='fileContents'
            inputType='textarea'
            inputValidate={YamlValidator}
            inputAction={this.handleChange}
          />
        </div>
        <div className='btn-row'>
          <ActionButton type='default'
            displayLabel={translate('cancel')}
            clickAction={() => this.handleCancel()}/>
          <ActionButton
            displayLabel={translate('save')}
            isDisabled={!this.state.isValid}
            clickAction={() => this.handleDone()}/>
        </div>
      </div>
    );
  }
}

class DisplayFileList extends Component {
  getMessage() {
    if (this.props.valid === UNKNOWN) {
      return (<div>{translate('validate.config.files.msg.info')}</div>);
    } else if (this.props.valid === VALIDATING) {
      return (<div>{translate('validate.config.files.msg.validating')}</div>);
    } else if (this.props.valid === VALID) {
      return (<div>{translate('validate.config.files.msg.valid')}</div>);
    } else {
      return (<div>{translate('validate.config.files.msg.invalid')}<br/>
        <pre className='log'>{this.props.invalidMsg}</pre></div>);
    }
  }

  getIcon() {
    var icon;
    if (this.props.valid === VALID) {
      icon = VALID_ICON;
    } else if (this.props.valid === INVALID) {
      icon = INVALID_ICON;
    }
    return (<img className='validate-result-icon' src={icon}/>);
  }

  render() {
    // make a copy of the yml file list and sort them by description
    var fileList = this.props.files.slice();
    fileList.sort(function(a,b) {
      var descA = a.description.toLowerCase(), descB = b.description.toLowerCase();
      return (descA < descB) ? -1 : (descA > descB) ? 1 : 0;});

    var list = fileList.map((file, index) => {
      return (<li key={index}>
        <a href="#" onClick={() => this.props.onEditClick(file)}>
          {file.description + (file.changed ? ' *' : '')}
        </a>
      </li>);
    });

    return (
      <div>
        <div className='validate-config-files'>
          <div className='body'>
            <div className='col-xs-6 verticalLine'>
              <ul>{list}</ul>
            </div>
            <div className='col-xs-6'>
              {this.getMessage()}
            </div>
          </div>
          <div>
            <ActionButton
              className='button-with-icon'
              displayLabel={translate('validate.config.files.validate')}
              clickAction={() => this.props.onValidateClick()}/>
            {this.getIcon()}
          </div>
        </div>
      </div>
    );
  }
}

class ValidateConfigFiles extends Component {
  constructor(props) {
    super(props);
    this.state = {
      configFiles: [],
      valid: UNKNOWN,
      editingFile: '',
      invalidMsg: ''
    };

    // retrieve a list of yml files
    fetchJson('/api/v1/clm/model/files')
      .then((responseData) => {
        this.setState({
          configFiles: responseData
        });
      });
  }

  editFile(file) {
    this.setState({editingFile: file});
    this.props.showNavButtons(false);
  }

  validateModel = () => {
    this.setState({valid: VALIDATING, invalidMsg: ''});

    postJson('/api/v1/clm/config_processor')
      .then(() => {
        this.setState({valid: VALID}, () => {
          this.props.enableNextButton(true);
        });
        this.clearAllChangeMarkers();
      })
      .catch(error => {
        this.props.enableNextButton(false);
        this.setState({valid: INVALID, invalidMsg: error.value.log});
      });
  }

  renderBody() {
    if (this.state.editingFile === '') {
      return (
        <DisplayFileList
          files={this.state.configFiles}
          back={this.props.back}
          next={this.props.next}
          onValidateClick={() => this.validateModel()}
          onEditClick={(file) => this.editFile(file)}
          valid={this.state.valid}
          invalidMsg={this.state.invalidMsg}
        />);
    } else {
      return (
        <EditFile
          file={this.state.editingFile}
          doneEditingFile={() => this.doneEditingFile()}
          valid={this.state.valid}
          setChanged={() => this.setChanged()}
          loadModel={this.props.loadModel}
        />
      );
    }
  }

  render() {
    return (
      <div>
        {this.renderBody()}
      </div>
    );
  }

  doneEditingFile() {
    this.setState({editingFile: ''});
    this.props.showNavButtons(true);
  }

  setChanged() {
    this.props.enableNextButton(false);

    if (this.state.valid === VALID) {
      this.setState({valid: UNKNOWN});
    }

    var updatedList = this.state.configFiles.map((val) => {
      if (val.name === this.state.editingFile.name) {
        val.changed = true;
      }
      return val;
    });
    this.setState({configFiles: updatedList});
  }

  clearAllChangeMarkers() {
    var updatedList = this.state.configFiles.map((val) => {
      val.changed = false;
      return val;
    });
    this.setState({configFiles: updatedList});
  }
}

class ConfigForm extends Component {
  constructor(props) {
    super(props);
    if (!props.deployConfig) {
      this.state = {
        wipeDisks: false,
        encryptKey: '',
        verbosity: 0
      };
    } else {
      this.state = props.deployConfig;
    }
  }

  handleWipeDisks = () => {
    this.setState({wipeDisks: !this.state.wipeDisks});
  };

  handlePasswordChange = (e) => {
    this.setState({encryptKey: e.target.value});
  };

  render() {
    return (
      <div className='config-form'>
        <div className='detail-line'>
          <div className='col-xs-4 label-container'>
            {translate('validate.deployment.doWipeDisks')}
            <HelpText tooltipText={translate('validate.deployment.doWipeDisks.tooltip')}/>
          </div>
          <div className='col-xs-8 checkbox-line'>
            <input type='checkbox'
              value='wipedisks'
              checked={this.state.wipeDisks}
              onChange={this.handleWipeDisks}/>
          </div>
        </div>

        <div className='detail-line'>
          <div className='col-xs-4 label-container'>
            {translate('validate.deployment.encryptKey')}
            <HelpText tooltipText={translate('validate.deployment.encryptKey.tooltip')}/>
          </div>
          <div className='col-xs-8'>
            <ServerInput
              inputName='encryptKey'
              inputType='password'
              inputValue={this.state.encryptKey}
              inputAction={this.handlePasswordChange}/>
          </div>
        </div>

        <div className='detail-line'>
          <div className='col-xs-4 label-container'>
            {translate('validate.deployment.verbosity')}
            <HelpText tooltipText={translate('validate.deployment.verbosity.tooltip')}/>
          </div>
          <div className='col-xs-8'>
            <Dropdown
              value={this.state.verbosity}
              onChange={(e) => this.setState({verbosity: e.target.value})}
              emptyOption={translate('none')}>
              <option key="0" value="0">{translate('validate.deployment.verbosity.lowest')}</option>
              <option key="1" value="1">1</option>
              <option key="2" value="2">2</option>
              <option key="3" value="3">3</option>
              <option key="4" value="4">{translate('validate.deployment.verbosity.highest')}</option>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }
}

class ConfigPage extends BaseWizardPage {
  constructor(props) {
    super(props);
    this.state = {
      key: TAB.MODEL_FILES,
      isNextable: false,
      showNavButtons: true
    };
  }

  setNextButtonLabel() {
    return translate('validate.config.files.deploy');
  }

  setNextButtonDisabled() {
    return !this.state.isNextable;
  }

  isError() {
    return !this.state.isNextable;
  }

  goBack(e) {
    e.preventDefault();
    this.props.updateGlobalState('deployConfig', this.refs.configFormData.state);
    this.props.back(false);
  }

  goForward(e) {
    e.preventDefault();
    this.props.updateGlobalState('deployConfig', this.refs.configFormData.state);
    this.props.next(this.isError());
  }

  showNavButtons = (enable) => {
    this.setState({showNavButtons: enable});
  };

  enableNextButton = (enable) => {
    this.setState({isNextable: enable});
  };

  render() {
    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('validate.config.files.heading'))}
        </div>
        <div className='wizard-content'>
          <Tabs id='configTabs' activeKey={this.state.key} onSelect={(tabKey) => {this.setState({key: tabKey});}}>
            <Tab eventKey={TAB.MODEL_FILES} title={translate('validate.tab.model')}>
              <ValidateConfigFiles enableNextButton={this.enableNextButton} showNavButtons={this.showNavButtons}
                loadModel={this.props.loadModel} />
            </Tab>
            <Tab eventKey={TAB.TEMPLATE_FILES} title={translate('validate.tab.templates')}>
              <ServiceTemplatesTab
                updateGlobalState={this.props.updateGlobalState} showNavButtons={this.showNavButtons}/>
            </Tab>
            <Tab eventKey={TAB.CONFIG_FORM} title={translate('validate.tab.config')}>
              <ConfigForm ref='configFormData' deployConfig={this.props.deployConfig} />
            </Tab>
          </Tabs>
        </div>
        {this.state.showNavButtons ? this.renderNavButtons() : ''}
      </div>
    );
  }
}

export default ConfigPage;
