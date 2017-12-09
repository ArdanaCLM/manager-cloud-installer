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
const PRE_DEPLOYMENT_PLAYBOOK = 'dayzero-pre-deployment';
const DAYZERO_SITE_PLAYBOOK = 'dayzero-site';
const SITE_PLAYBOOK = 'site';

const PLAYBOOK_STEPS = [
  {
    label: translate('deploy.progress.config-processor-run'),
    playbooks: ['config-processor-run.yml']
  },
  {
    label: translate('deploy.progress.ready-deployment'),
    playbooks: ['ready-deployment.yml']
  },
  {
    label: translate('deploy.progress.predeployment'),
    playbooks: ['dayzero-pre-deployment.yml', ]
  },
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
    playbooks: ['site.yml', 'dayzero-site.yml'] //either site.yml or dayzero-site.yml
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

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
  }

  // Clear out the global playbookStatus entry for PRE_DEPLOYMENT_PLAYBOOK,
  // DAYZERO_SITE_PLAYBOOK or SITE_PLAYBOOK and commitStatus
  // which permits running the deploy multiple times when have errors and
  // need to go back
  resetPlaybookStatus = () => {
    this.props.updateGlobalState('commitStatus', '');
    if (this.props.playbookStatus) {
      let playStatus = this.props.playbookStatus.slice();
      playStatus.forEach((play, idx) => {
        // remove the exist one
        if (play.name === PRE_DEPLOYMENT_PLAYBOOK ||
          play.name === DAYZERO_SITE_PLAYBOOK || play.name === SITE_PLAYBOOK) {
          play.playId = '';
          play.status = '';
        }
      });
      this.props.updateGlobalState('playbookStatus', playStatus);
    }
  }

  goBack(e) {
    e.preventDefault();
    this.resetPlaybookStatus();
    super.goBack(e);
  }

  render() {
    // choose between site or site with wipedisks (dayzero-site)
    let sitePlaybook = SITE_PLAYBOOK;

    // Build the payload from the deployment configuration page options
    let payload = {};
    //TODO this is saved for reload...what to do with encryptKey
    if (this.props.deployConfig) {
      if (this.props.deployConfig['wipeDisks']) {
        sitePlaybook = DAYZERO_SITE_PLAYBOOK;
      }
      payload['verbose'] = this.props.deployConfig['verbosity'];
      payload['extraVars'] = {};
      // don't prompt "Are you sure?" questions for wipedisks
      payload['extraVars']['automate'] = 'true';
      if (this.props.deployConfig['encryptKey']) {
        payload['extraVars']['encryptKey'] = this.props.deployConfig['encryptKey'];
      }
    }

    let commit = this.props.commitStatus; //global saved state
    if(commit === undefined || commit === '') {
      commit = STATUS.NOT_STARTED;
      this.props.updateGlobalState('commitStatus', commit);
    }

    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('deploy.progress.heading'))}
        </div>
        <div className='wizard-content'>
          <PlaybookProgress
            updateStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
            playbookStatus = {this.props.playbookStatus} commitStatus = {commit}
            steps = {PLAYBOOK_STEPS} deployConfig = {this.props.deployConfig}
            playbooks = {[PRE_DEPLOYMENT_PLAYBOOK, sitePlaybook]} payload = {payload}/>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default CloudDeployProgress;
