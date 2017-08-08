import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import { ActionButton } from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';

const INVALID = 0;
const VALID = 1;
const UNKNOWN = -1;
const VALID_ICON = require('../images/Checked-48.png');
const INVALID_ICON = require('../images/Cancel-48.png');

class EditFile extends Component {

  constructor(props) {
    super(props);
    this.state = {
      contents : ''
    };
  }

  componentWillMount() {
    fetch('http://localhost:8081/api/v1/clm/model/files/' + this.props.file.name)
      .then(response => response.json())
      .then((response) => {
        this.setState({contents: response});
      });
  }

  handleDone() {
    this.props.doneEditingFile();
    this.props.setValid({valid: UNKNOWN});

    fetch('http://localhost:8081/api/v1/clm/model/files/' + this.props.file.name, {
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
      <div>
        <div className='heading'>
          {translate('edit.config.files.heading', this.props.file.description, this.props.file.name)}
        </div>
        <div>
          <textarea name='fileContents' className='config-file-editor' wrap='off'
            value={this.state.contents} onChange={(e) => this.handleChange(e)}/>
        </div>
        <div>
          <ActionButton
            displayLabel={translate('cancel')}
            clickAction={() => this.handleCancel()}/>
          <ActionButton
            displayLabel={translate('done')}
            clickAction={() => this.handleDone()}/>
        </div>
      </div>
    );
  }
}

class DisplayFileList extends BaseWizardPage {
  getMessage() {
    var msg;
    if (this.props.valid === UNKNOWN) {
      msg = translate('validate.config.files.msg.info');
    } else if (this.props.valid === VALID) {
      msg = translate('validate.config.files.msg.valid');
    } else {
      msg = translate('validate.config.files.msg.invalid');
    }
    return (<div className='info'>{msg}<br/>{this.props.invalidMsg}</div>);
  }

  getIcon() {
    var icon;
    if (this.props.valid === VALID) {
      icon = VALID_ICON;
    } else if (this.props.valid === INVALID) {
      icon = INVALID_ICON;
    }
    return (<img src={icon}/>);
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
        <a href="#" onClick={() => this.props.onEditClick(file)}>{file.description}</a>
      </li>);
    });

    return (
      <div className='validateConfigFiles'>
        <div className='heading'>{translate('validate.config.files.heading')}</div>
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
            displayLabel={translate('validate.config.files.validate')}
            clickAction={() => this.props.onValidateClick()}/>
          {this.getIcon()}
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
    fetch('http://localhost:8081/api/v1/clm/model/files')
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
    // TODO - replace with real backend call once implemented
    // for now switching between valid and invalid result
    var bodyStr = {'want_pass': true};
    if (this.state.valid !== INVALID) {
      bodyStr = {'want_fail': true};
    }
    fetch('http://localhost:8081/api/v1/clm/config_processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyStr)
    })
      .then(response => {
        if (response.ok) {
          this.setState({valid: VALID});
        } else {
          this.setState({valid: INVALID});
        }
        return response.json();
      })
      .then(responseData => {
        if (responseData.log) {
          // TODO - switch to real log meg once implemented
          // this.setState({invalidMsg: responseData.log});
          var msg = 'ERR: Server role \'HLM-ROLE2\' used by server deployer is not defined';
          this.setState({invalidMsg: msg});
        } else {
          this.setState({invalidMsg: ''});
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
          setValid={(val) => this.setValid(val)}
        />
      );
    }
  }

  render() {
    return (
      <div className='wizardContentPage'>
        {this.renderBody()}
      </div>
    );
  }

  doneEditingFile() {
    this.setState({editingFile: ''});
  }

  setValid(state) {
    this.setState({valid: state});
  }
}

export default ValidateConfigFiles;
