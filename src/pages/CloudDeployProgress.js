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

import { translate } from '../localization/localize.js';
import { STATUS } from '../utils/constants.js';
import BaseWizardPage from './BaseWizardPage.js';
import { PlaybookProgress } from '../components/PlaybookProcess.js';

/*
  Navigation rules:
  - while the playbook is running (or unknown), Back and Next are disallowed
  - if the playbook ended successfully, only Next is allowed
  - if the playbook failed, only Back is allowed

  The play id is kept in the global state, and its absence indicates
  that the playbook should be launched.
*/

const SITE_STEPS = [
  {
    label: translate('deploy.progress.step1'),
    playbooks: ['network_interface-deploy.yml']
  },
  {
    label: translate('deploy.progress.step2'),
    playbooks: ['nova-deploy.yml', 'ironic-deploy.yml', 'magnum-deploy.yml']
  },
  {
    label: translate('deploy.progress.step3'),
    playbooks: ['monasca-agent-deploy.yml', 'monasca-deploy.yml', 'monasca-transform-deploy.yml']
  },
  {
    label: translate('deploy.progress.step4'),
    playbooks: ['ceph-deploy.yml', 'cinder-deploy.yml', 'swift-deploy.yml']
  },
  {
    label: translate('deploy.progress.step5'),
    playbooks: ['hlm-status.yml']
    //playbooks: ['ops-console-status.yml']//swap these to test-run using a short running playbook
  },
  {
    label: translate('deploy.progress.step6'),
    playbooks: ['site.yml']
  }
];

class CloudDeployProgress extends BaseWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      overallStatus: STATUS.UNKNOWN // overall status of entire playbook
    };
  }
  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;
  setBackButtonDisabled = () => this.state.overallStatus != STATUS.FAILED;

  updateStatus = (status) => {this.setState({overallStatus: status});}
  updatePlayId = (playId) => {this.props.updateGlobalState('sitePlayId', playId);}

  render() {
    // choose between site or site with wipedisks (dayzero-site)
    let sitePlaybook = 'site';

    // Build the payload from the deployment configuration page options
    let payload = {};
    if (this.props.deployConfig) {
      if (this.props.deployConfig['wipeDisks']) {
        sitePlaybook = 'dayzero-site';
      }
      payload['verbose'] = this.props.deployConfig['verbosity'];
      payload['extraVars'] = {};
      // don't prompt "Are you sure?" questions for wipedisks
      payload['extraVars']['automate'] = 'true';
      if (this.props.deployConfig['encryptKey']) {
        payload['extraVars']['encryptKey'] = this.props.deployConfig['encryptKey'];
      }
    }

    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('deploy.progress.heading'))}
        </div>
        <div className='wizard-content'>
          <PlaybookProgress
            overallStatus = {this.state.overallStatus}
            updateStatus = {this.updateStatus}
            playId = {this.props.sitePlayId}
            updatePlayId = {this.updatePlayId}
            steps = {SITE_STEPS}
            deployConfig = {this.props.deployConfig}
            playbook = {sitePlaybook}
            payload = {payload}
          />
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default CloudDeployProgress;
