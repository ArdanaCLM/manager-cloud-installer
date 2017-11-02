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
import BaseWizardPage from './BaseWizardPage.js';

/**
 * This is just a temporary placeholder component to show an example of a page that has
 * forward and back buttons in the wizard
 */
class GenericPlaceHolder extends BaseWizardPage {

  render() {

    return (
      <div className='wizard-content'>
        {this.renderHeading(translate('generic.placeholder.heading'))}
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default GenericPlaceHolder;
