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

class InstallIntro extends BaseWizardPage {
  getSteps() {
    var lines = [];
    for (var i=1; i<7; i++) {
      lines.push(<li key={i}>{translate('install.intro.message.step' + i)}</li>);
    }
    return (<ul>{lines}</ul>);
  }

  render() {
    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('welcome.cloud.install'))}
        </div>
        <div className='wizard-content'>
          <div className='installIntro'>
            <div className='col-xs-7'>
              <div className='topLine'>{translate('install.intro.message.body1')}</div>
              <div>{translate('install.intro.message.body2')}</div>
            </div>
            <div className='col-xs-1'></div>
            <div className='col-xs-4'>
              <h5>{translate('install.intro.message.steps.heading')}</h5>
              {this.getSteps()}
            </div>
          </div>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default InstallIntro;
