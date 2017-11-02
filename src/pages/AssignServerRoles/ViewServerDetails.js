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
import SmServerDetails from './SmServerDetails.js';
import OvServerDetails from './OvServerDetails.js';
import ModelServerDetails from './ModelServerDetails.js';

class ViewServerDetails extends Component {
  constructor(props) {
    super(props);
    this.className = 'view-server-details ';
  }

  handleClose = () => {
    this.props.cancelAction();
  }

  renderDetailsContent() {
    if(this.props.tableId && this.props.source === 'sm') {
      return (<SmServerDetails data={this.props.data} {...this.props}/>);
    }
    else if(this.props.tableId && this.props.source === 'ov') {
      return (<OvServerDetails data={this.props.data} {...this.props}/>);
    }
    else { //for manual added items or no source item
      this.className = this.className + 'shorter-height';
      return (<ModelServerDetails data={this.props.data}/>);
    }
  }

  renderFooter() {
    return (
      <div className='btn-row button-container'>
        <ActionButton
          clickAction={this.handleClose} displayLabel={translate('common.close')}/>
      </div>
    );
  }

  render() {
    return (
      <div className={this.className}>
        {this.renderDetailsContent()}
        {this.renderFooter()}
      </div>
    );
  }
}

export default ViewServerDetails;
