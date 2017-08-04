import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import GenericPlaceHolder from './GenericPlaceHolder';
import { ActionButton } from '../components/Buttons.js';

const INVALID = 0;
const VALID = 1;
const UNKNOWN = -1;
const VALID_ICON = require('../images/Checked-48.png');
const INVALID_ICON = require('../images/Cancel-48.png');

class EditFile extends Component {

  render() {
    return (
      <div className='heading'>
        {translate('edit.config.files.heading', this.props.file.description, this.props.file.name)}
        <pre>
          {this.props.file.name}
          {this.props.file.description}
        </pre>
        <ActionButton
          displayLabel='Done'
          clickAction={() => this.props.onClick()}/>
      </div>
    );
  }
}

class DisplayFileList extends Component {
  getMessage() {
    var msg;
    if (this.props.valid === UNKNOWN) {
      msg = 'Click on a configuration file to view or edit its content. ' +
        'Click the Validate button to run the configuration processor.';
    } else if (this.props.valid === VALID) {
      msg = 'The configuration processor completed successfully. Data model is valid.';
    } else {
      msg = 'The configuration processor failed.\n' +
        'ERR: Server role \'HLM-ROLE2\' used by server deployer is not defined';
    }
    return (<div className='info'>{msg}</div>);
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

  render() {
    var list = this.props.files.map((file, index) => {
      return (<li key={index}>
        <a href="#" onClick={() => this.props.onEditClick(file)}>{file.description}</a>
      </li>)
    });

    return (
      <div className='validateConfigFiles'>
        <div className='heading'>{translate('validate.config.files.heading')}</div>
        <div>{this.props.valid}</div>
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
      </div>
    );
  }
}

class ValidateConfigFiles extends GenericPlaceHolder {
  constructor() {
    super();
    this.state = {
      configFiles: [],
      valid: UNKNOWN,
      editingFile: ''
    }

    // retrieve a list of yml files
    // TODO - replace with real backend call once implemented
    fetch('http://localhost:8080/configFiles')
      .then(response => response.json())
      .then((responseData) => {
        console.log(responseData);
        this.setState({
          configFiles: responseData
        });
      });
  }

  isError() {
    return(this.state.valid != VALID)
  }

  editFile(file) {
    this.setState({editingFile: file});
  }

  setNextButtonLabel() {
    return translate('validate.config.files.deploy');
  }

  setNextButtonDisabled() {
    return this.state.valid === VALID ? false : true;
  }

  doneEditingFile() {
    this.setState({editingFile: ''});
    this.setState({valid: UNKNOWN});
  }

  validateModel() {
    console.log('validate model');
    // TODO - replace with real backend call once implemented
    // for now switching between valid and invalid result
    if (this.state.valid !== INVALID) {
      this.setState({valid: INVALID});
    } else {
      this.setState({valid: VALID});
    }
  }

  renderBody() {
    console.log('renderBody')
    if (this.state.editingFile === '') {
      return (
        <DisplayFileList
          files={this.state.configFiles}
          onValidateClick={() => this.validateModel()}
          onEditClick={(file) => this.editFile(file)}
          valid={this.state.valid}
        />);
    } else {
      return (
        <EditFile
          file={this.state.editingFile}
          onClick={() => this.doneEditingFile()}
          setValid={(val) => this.setValid(val)}
        />
      );
    }
  }

  render() {
    return (
      <div className='generic-container'>
        {this.renderBody()}
        {this.renderNavButtons()}
      </div>
    );
  }

  setValid(state) {
    this.state.valid = state;
  }
}

export default ValidateConfigFiles;
