import CloudModelPicker from '../pages/CloudModelPicker';
import CloudModelSummary from '../pages/CloudModelSummary';
import AssignServerRoles from '../pages/AssignServerRoles';
import Complete from '../pages/Complete';
import InstallIntro from '../pages/InstallIntro';
import ValidateConfigFiles from '../pages/ValidateConfigFiles';
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
  name: 'ValidateConfigFiles',
  component: ValidateConfigFiles
}, {
  name: 'CloudDeployProgress',
  component: CloudDeployProgress
}, {
  name: 'Complete',
  component: Complete
}];
