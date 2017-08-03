import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import GenericPlaceHolder from './GenericPlaceHolder';
import { ActionButton } from '../components/Buttons.js';

class ValidateConfigFiles extends GenericPlaceHolder {
  constructor() {
    super();
    this.state = {
      configFiles: [],
    }

    // retrieve a list of yml files
    // TODO - replace with real backend call once implemented
    fetch('http://localhost:8080/configFiles')
      .then(response => response.json())
      .then((responseData) => {
        var files = responseData.map((fileObj) => {return fileObj.description});
        this.setState({
          configFiles: files
        });
      });
  }

  render() {
    var list = this.state.configFiles.map((file, index) => {
      return (<li key={index}>{file}</li>)
    });

    return (
      <div>
        <div className='wizardContentPage'>
          <div className='heading'>
            {translate('validate.config.files.heading')}
          </div>

          <div className='validateConfigFiles'>
            <ul>{list}</ul>
          </div>
        </div>
        <div>
          <ActionButton
            displayLabel={translate('validate.config.files.validate')}
            clickAction={() => alert('click')}/>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }

  validateModel() {

  }
}

export default ValidateConfigFiles;
