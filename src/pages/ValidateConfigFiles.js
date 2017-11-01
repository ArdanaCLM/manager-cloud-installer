// (c) Copyright 2017 SUSE LLC
import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import { ActionButton } from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';

const INVALID = 0;
const VALID = 1;
const UNKNOWN = -1;
const VALIDATING = 2;
const VALID_ICON = require('../images/Checked-48.png');
const INVALID_ICON = require('../images/Cancel-48.png');

class EditFile extends BaseWizardPage {

  constructor(props) {
    super(props);
    this.state = {
      contents : ''
    };
  }

  componentWillMount() {
    fetch(getAppConfig('shimurl') + '/api/v1/clm/model/files/' + this.props.file.name)
      .then(response => response.json())
      .then((response) => {
        this.setState({contents: response});
      });
  }

  handleDone() {
    this.props.setChanged();
    this.props.doneEditingFile();

    fetch(getAppConfig('shimurl') + '/api/v1/clm/model/files/' + this.props.file.name, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.contents)
    });
  }

  handleCancel() {
    this.props.doneEditingFile();
  }

  handleChange(event) {
    this.setState({contents: event.target.value});
  }

  render() {
    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('edit.config.files.heading', this.props.file.description,
            this.props.file.name))}
        </div>
        <div className='wizard-content'>
          <div>
            <textarea name='fileContents' className='config-file-editor rounded-corner' wrap='off'
              value={this.state.contents} onChange={(e) => this.handleChange(e)}/>
          </div>
          <div className="btn-row">
            <ActionButton type='default'
              displayLabel={translate('cancel')}
              clickAction={() => this.handleCancel()}/>
            <ActionButton
              displayLabel={translate('save')}
              clickAction={() => this.handleDone()}/>
          </div>
        </div>
      </div>
    );
  }
}

class DisplayFileList extends BaseWizardPage {
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

  setNextButtonLabel() {
    return translate('validate.config.files.deploy');
  }

  setNextButtonDisabled() {
    return this.props.valid !== VALID;
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
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('validate.config.files.heading'))}
        </div>
        <div className='wizard-content'>
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
        {this.renderNavButtons()}
      </div>
    );
  }
}

class ValidateConfigFiles extends Component {
  constructor() {
    super();
    this.state = {
      configFiles: [],
      valid: UNKNOWN,
      editingFile: '',
      invalidMsg: ''
    };

    // retrieve a list of yml files
    fetch(getAppConfig('shimurl') + '/api/v1/clm/model/files')
      .then(response => response.json())
      .then((responseData) => {
        this.setState({
          configFiles: responseData
        });
      });
  }

  isError() {
    return (this.state.valid != VALID);
  }

  editFile(file) {
    this.setState({editingFile: file});
  }

  validateModel() {
    this.setState({valid: VALIDATING, invalidMsg: ''});
    // for testing purposes, set dev = true
    // to switch between valid and invalid results
    var dev = false;
    var bodyStr = '';
    if (dev) {
      bodyStr = (this.state.valid !== INVALID) ? {'want_fail': true} : {'want_pass': true};
    }

    fetch(getAppConfig('shimurl') + '/api/v1/clm/config_processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyStr)
    })
      .then(response => {
        if (response.ok) {
          this.setState({valid: VALID});
          this.clearAllChangeMarkers();
          return JSON.stringify('');  // success call do not return any json
        } else {
          this.setState({valid: INVALID});
          return response.json();
        }
      })
      .then(responseData => {
        if (responseData.log) {
          if (dev) {
            var msg = 'ERR: Server role \'HLM-ROLE2\' used by server deployer is not defined';
            this.setState({invalidMsg: msg});
          } else {
            this.setState({invalidMsg: responseData.log});
          }
        }
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
  }

  setChanged() {
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

export default ValidateConfigFiles;
