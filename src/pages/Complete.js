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
import React from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage';
import { fetchJson } from '../utils/RestUtils.js';

class Complete extends BaseWizardPage {

  constructor() {
    super();
    this.state = {
      horizon: '',
      opsconsole: ''
    };

    fetchJson('/api/v1/external_urls')
      .then(responseData => {
        if (responseData.horizon) {
          this.setState({horizon: responseData.horizon});
        }
        if (responseData.opsconsole) {
          this.setState({opsconsole: responseData.opsconsole});
        }
      })
      .catch((error) => {
        console.log('Unable to retrieve external URLs');// eslint-disable-line no-console
      });

    fetchJson('/api/v1/clm/user')
      .then(responseData => {
        if (responseData.username) {
          this.setState({userName: responseData.username});
        }
      })
      .catch((error) => {
        console.log('Unable to retrieve user name');// eslint-disable-line no-console
      });
  }

  render() {
    const modelName = translate('model.picker.' + this.props.model.get('name'));

    let commandLines = [];
    if (this.state.userName) {
      commandLines.push(<div className='paragraph-start' key='commandLine1'>
        {translate('complete.message.body4', this.state.userName)}</div>);
      commandLines.push(<div className='indent' key='commandLine2'>
        {translate('complete.message.body5')}</div>);
      commandLines.push(<div className='indent' key='commandLine3'>
        {translate('complete.message.body6')}</div>);
    }

    let linkSection = '';
    if (this.state.horizon !== '' || this.state.opsconsole !== '') {
      let links = [];
      if (this.state.horizon !== '') {
        links.push(<li><a href={this.state.horizon}>{translate('complete.message.link1')}</a></li>);
      }
      if (this.state.opsconsole !== '') {
        links.push(<li><a href={this.state.opsconsole}>{translate('complete.message.link2')}</a></li>);
      }
      linkSection = (
        <div className='col-xs-4'>
          <h5>{translate('complete.message.link.heading')}</h5>
          <ul>
          {links}
          </ul>
        </div>
      );
    }

    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('complete.heading'))}
        </div>
        <div className='wizard-content'>
          <div className='installIntro'>
            <div className='col-xs-7'>
              <div>{translate('complete.message.body1')}</div>
              <div className='paragraph-start'>{translate('complete.message.body2')}</div>
              <div className='indent'>{translate('complete.message.body3', modelName)}</div>
              {commandLines}
            </div>
            <div className='col-xs-1'></div>
            {linkSection}
          </div>
        </div>
      </div>
    );
  }
}

export default Complete;
