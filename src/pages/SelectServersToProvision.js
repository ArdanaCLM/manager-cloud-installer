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
import { ActionButton } from '../components/Buttons.js';
import { YesNoModal } from '../components/Modals.js';
import BaseWizardPage from './BaseWizardPage.js';
import TransferTable from '../components/TransferTable.js';
import { ServerInputLine } from '../components/ServerUtils.js';
import { PlaybookProgress } from '../components/PlaybookProcess.js';
import { fetchJson } from '../utils/RestUtils.js';


const OS_INSTALL_STEPS = [
  {
    label: translate('install.progress.step1'),
    playbooks: ['bm-power-status.yml']
  },
  {
    label: translate('install.progress.step2'),
    playbooks: ['cobbler-deploy.yml']
  },
  {
    label: translate('install.progress.step3'),
    playbooks: ['bm-reimage.yml']
  },
  {
    label: translate('install.progress.step4'),
    playbooks: ['dayzero-os-provision.yml']
  }
];


class SelectServersToProvision extends BaseWizardPage {
  constructor(props) {
    super(props);
    this.state = {
      allServers: [],
      leftList: [],
      rightList: [],

      osInstallUsername: '',
      osInstallPassword: '',
      installing: false,
      showModal: false,
      overallStatus: STATUS.UNKNOWN, // overall status of install playbook
    };

    this.ips = [];
  }

  goForward = (e) => {
    e.preventDefault();

    // Clear out the installPlayId when going to the next screen,
    // which permits running the installer multiple times
    this.props.updateGlobalState('installPlayId', undefined);

    super.goForward(e);
  }

  goBack = (e) => {
    e.preventDefault();

    // Clear out the installPlayId when going to the next screen,
    // which permits running the installer multiple times
    this.props.updateGlobalState('installPlayId', undefined);

    super.goBack(e);
  }

  componentWillMount() {
    // retrieve a list of servers that have roles
    fetchJson('/api/v1/clm/model/entities/servers')
      .then(responseData => {
        this.setState({
          allServers: responseData,
          leftList: responseData.map(svr => svr.name || svr.id).sort()
        });
      })
      .then(() => fetchJson('/api/v1/ips'))
      .then(data => {this.ips = data;});

    fetchJson('/api/v1/clm/user')
      .then(responseData => {
        this.setState({
          osInstallUsername: responseData['username']
        });
      });
  }

  setBackButtonDisabled = () => {
    return this.props.installPlayId && !(
      this.state.overallStatus == STATUS.COMPLETE ||
      this.state.overallStatus == STATUS.FAILED);
  }

  setNextButtonDisabled = () => {
    if (this.props.installPlayId) {
      return this.state.overallStatus != STATUS.COMPLETE;
    } else {
      return this.state.rightList.length > 0;
    }
  }

  handleOsInstallPassword = (e, valid, props) => {
    const password = e.target.value;
    this.setState({osInstallPassword: password});
  }

  renderTransferTable() {
    return (
      <div>
        <div className='content-header'>
          {this.renderHeading(translate('provision.server.heading'))}
        </div>
        <div className='wizard-content'>
          <div className='server-provision'>
            <div className='password-container'>
              <div className='detail-line'>
                <div className='detail-heading'>{translate('server.user.prompt')}</div>
                <div>{this.state.osInstallUsername}</div>
              </div>
              <ServerInputLine
                isRequired='true'
                label='server.pass.prompt'
                inputName='osInstallPassword'
                inputType='password'
                inputValue={this.state.osInstallPassword}
                inputAction={this.handleOsInstallPassword}/>
            </div>

            <TransferTable
              leftList={this.state.leftList}
              rightList={this.state.rightList}
              updateLeftList={(list) => this.setState({leftList: list})}
              updateRightList={(list) => this.setState({rightList: list})}
              leftTableHeader={translate('provision.server.left.table')}
              rightTableHeader={translate('provision.server.right.table')}/>
            <div className='button-container'>
              <ActionButton
                displayLabel={translate('provision.server.install')}
                clickAction={() => this.setState({showModal: true})}
                isDisabled={this.state.rightList.length == 0 || this.state.osInstallPassword === ''}/>
            </div>
            <YesNoModal show={this.state.showModal}
              title={translate('warning')}
              yesAction={() => this.setState({installing: true, showModal: false})}
              noAction={() => this.setState({showModal: false})}>
              {translate('provision.server.confirm.body', this.state.rightList.length)}
            </YesNoModal>
          </div>
        </div>
      </div>
    );
  }

  renderBody() {
    if (this.state.installing || this.props.installPlayId) {
      const serversToProvision = this.state.allServers.filter(e =>
        this.state.rightList.includes(e.name || e.id) && ! this.ips.includes(e['ip-addr']));

      const payload = {
        'extra-vars': {
          'nodelist': serversToProvision.map(e => e.id).join(','),
          'ardanauser_password': this.state.osInstallPassword
        }};

      return (
        <div>
          <div className='content-header'>
            {this.renderHeading(translate('provision.server.progress.heading'))}
          </div>
          <div className='wizard-content'>
            <PlaybookProgress
              overallStatus={this.state.overallStatus}
              updateStatus={(status) => this.setState({overallStatus: status}) }
              playId={this.props.installPlayId}
              updatePlayId={(playId) => this.props.updateGlobalState('installPlayId', playId) }
              steps={OS_INSTALL_STEPS}
              playbook="dayzero-os-provision"
              payload={payload} />
          </div>
        </div>);
    } else {
      return this.renderTransferTable();
    }
  }

  render() {
    return (
      <div className='wizard-page'>
        {this.renderBody()}
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default SelectServersToProvision;
