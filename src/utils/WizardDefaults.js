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
import CloudModelPicker from '../pages/CloudModelPicker';
import CloudModelSummary from '../pages/CloudModelSummary';
import AssignServerRoles from '../pages/AssignServerRoles';
import Complete from '../pages/Complete';
import InstallIntro from '../pages/InstallIntro';
import ConfigPage from '../pages/ValidateConfigFiles';
import CloudDeployProgress from '../pages/CloudDeployProgress';
import SelectServersToProvision from '../pages/SelectServersToProvision';
import ServerRoleSummary from '../pages/ServerRoleSummary';

/**
 * Define the name of each step and its corresponding React Component.
 * The class containing the React component should be imported into this file.
 * When retrieving the stored state, the order of element will be compared with this
 * list, and if they are different, the wizard will start over at the beginning
 */
export const pages = [{
  name: 'InstallIntro',
  component: InstallIntro
}, {
  name: 'CloudModelPicker',
  component: CloudModelPicker
}, {
  name: 'CloudModelSummary',
  component: CloudModelSummary
}, {
  name: 'AssignServerRoles',
  component: AssignServerRoles
}, {
  name: 'SelectServersToProvision',
  component: SelectServersToProvision
}, {
  name: 'ServerRoleSummary',
  component: ServerRoleSummary
}, {
  name: 'ConfigPage',
  component: ConfigPage
}, {
  name: 'CloudDeployProgress',
  component: CloudDeployProgress
}, {
  name: 'Complete',
  component: Complete
}];
