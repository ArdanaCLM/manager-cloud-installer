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
import { ActionButton } from '../../components/Buttons.js';
import { alphabetically } from '../../utils/Sort.js';
import { fetchJson, postJson } from '../../utils/RestUtils.js';
import { ErrorMessage } from '../../components/Messages.js';
import { ServerInput } from '../../components/ServerUtils.js';

class EditTemplateFile extends Component {
  constructor(props) {
    super(props);
    this.state = { contents : ''};
  }

  componentWillMount() {
    fetchJson('/api/v1/clm/service/files/' +  this.props.editFile)
      .then((response) => {
        this.setState({contents: response});
      });
  }

  handleSaveEdit = () => {
    postJson(
      '/api/v1/clm/service/files/' + this.props.editFile, JSON.stringify(this.state.contents));

    this.props.closeAction(this.props.editFile);
  }

  handleChange = (event) => {
    this.setState({contents: event.target.value});
  }

  handleCancel() {
    this.props.closeAction();
  }

  render() {
    return (
      <div className='edit-container file-editor'>
        <ServerInput
          inputValue={this.state.contents}
          inputName='fileContents'
          inputType='textarea'
          inputAction={this.handleChange}
        />
        <div className='button-container btn-row'>
          <ActionButton type='default'
            displayLabel={translate('cancel')}
            clickAction={() => this.handleCancel()}/>
          <ActionButton
            displayLabel={translate('save')}
            clickAction={() => this.handleSaveEdit()}/>
        </div>
      </div>
    );
  }
}

class ServiceTemplatesTab extends Component {
  constructor(props) {
    super(props);
    this.state = {

      // List of files like :
      // [{service: 'cinder', files: ['api-cinder.conf.j2', 'api.conf.j2']}]
      serviceFiles: undefined,

      // which file is in edit
      editFile: undefined,

      // the service name of the file in editing
      editServiceName: undefined,

      // expanded services
      expandedServices: [],

      // for error message
      errorContent: undefined
    };
  }

  componentWillMount() {
    //retrieve a list of j2 files for services
    fetchJson('/api/v1/clm/service/files')
      .then((responseData) => {
        this.setState({serviceFiles: responseData});
      })
      .catch((error) => {
        this.setState({
          errorContent: {
            messages: [
              translate('validate.config.service.getfiles.error'), error.toString()
            ]
          }
        });
      });
  }

  handleEditFile = (seviceName, file) => {
    this.setState ({editServiceName: seviceName, editFile: file});
    this.props.showNavButtons(false);
  }

  handleCloseEdit = () => {
    this.setState ({editFile: undefined, editServiceName: undefined});
    this.props.showNavButtons(true);
  }

  handleToggleService = (item) => {
    item.expanded = !item.expanded;
    if(item.expanded) {
      let openIndex = this.state.expandedServices.findIndex((itm) => {
        return itm.service === item.service;
      });
      let openS = this.state.expandedServices.slice();
      openS.splice(openIndex, 1);
      this.setState({expandedServices: openS});
    }
    else {
      let openS = this.state.expandedServices.slice();
      openS.push(item);
      this.setState({expandedServices: openS});
    }
  }

  renderErrorMessage() {
    if (this.state.errorContent) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage
            closeAction={() => this.setState({errorContent: undefined})}
            message={this.state.errorContent.messages}>
          </ErrorMessage>
        </div>
      );
    }
  }

  renderFileSection() {
    if(this.state.editFile) {
      return (
        <div>
          <h3>{this.state.editServiceName + ' - ' + this.state.editFile}</h3>
          <EditTemplateFile closeAction={this.handleCloseEdit}
            editFile={this.state.editServiceName + '/' + this.state.editFile}/>
        </div>
      );
    }
    else {
      return (<div className='col-xs-6'>{translate(('validate.config.service.info'))}</div>);
    }
  }

  renderFileList(index, item) {
    if(item.expanded) {
      let fileList = [];
      item.files
        .sort((a, b) => alphabetically(a, b))
        .map((file, idx) => {
          fileList.push(
            <li key={idx}>
              <a href="#" onClick={() => this.handleEditFile(item.service, file)}>{file}</a>
            </li>
          );
        });
      return (
        <li key={index}>
          <span className='service-heading'>
            <i className='material-icons folder'
              onClick={() => this.handleToggleService(item)}>keyboard_arrow_down</i>
            <h4>{item.service}</h4></span>
          <ul className='file-list'>{fileList}</ul>
        </li>
      );
    }
    else { // when service not expanded
      return (
        <li key={index}>
          <span className='service-heading'>
            <i className='material-icons folder'
              onClick={() => this.handleToggleService(item)}>keyboard_arrow_right</i>
            <h4>{item.service}</h4></span>
        </li>
      );
    }
  }

  renderServiceList() {
    let serviceList = [];
    this.state.serviceFiles && this.state.serviceFiles
      .sort((a,b) => alphabetically(a['service'], b['service']))
      .forEach((item, index) => {
        if(item.files && item.files.length > 0) {
          if(item.expanded === undefined) {
            item.expanded = false;
          }
          serviceList.push(this.renderFileList(index, item));
        }
      });

    return (
      <div className='col-xs-6 verticalLine'>
        <ul className='all-service-list'>{serviceList}</ul>
      </div>
    );
  }

  render() {
    return (
      <div className='template-service-files'>
        <div>
          {!this.state.editFile && this.renderServiceList()}
          {this.renderFileSection()}
        </div>
        {this.renderErrorMessage()}
      </div>
    );
  }
}

export default ServiceTemplatesTab;
