import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import GenericPlaceHolder from './GenericPlaceHolder';
import { ActionButton } from '../components/Buttons.js';

const INVALID = 0
const VALID = 1
const UNKNOWN = -1

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

  render() {
    var list = this.props.files.map((file, index) => {
      return (<li key={index}>
        <a href="#" onClick={() => this.props.onEditClick(file)}>{file.description}</a>
      </li>)
    });

    return (
      <div>
        <div className='heading'>
          {translate('validate.config.files.heading')}
        </div>
        <div>{this.props.valid}</div>
        <div className='validateConfigFiles'>
          <ul>{list}</ul>
        </div>
        <div>
          <ActionButton
            displayLabel={translate('validate.config.files.validate')}
            clickAction={() => this.props.onValidateClick()}/>
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
        // var files = responseData.map((fileObj) => {return fileObj.description});
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

  doneEditingFile() {
    this.setState({editingFile: ''});
    this.setState({valid: UNKNOWN});
  }

  validateModel() {
    console.log('validate model')
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
