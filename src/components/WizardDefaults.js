import CloudModelPicker from '../pages/CloudModelPicker';
import CloudModelSummary from '../pages/CloudModelSummary';
import AssignServerRoles from '../pages/AssignServerRoles';
import GenericPlaceHolder from '../pages/GenericPlaceHolder';
import InstallIntro from '../pages/InstallIntro';
import ArdanaServerList from '../sandbox/ardanaServerList';
import ValidateConfigFiles from '../pages/ValidateConfigFiles';

/**
 * The element name for each step is stored in the state object. To convert it to its proper React
 * Component class, there needs to be a mapping between the name and the actual class implementation.
 * The string should match the class name, and the class should be imported into this file
 */
export const elementMapping = {
  'InstallIntro': InstallIntro,
  'CloudModelPicker': CloudModelPicker,
  'CloudModelSummary': CloudModelSummary,
  'GenericPlaceHolder': GenericPlaceHolder,
  'ArdanaServerList': ArdanaServerList,
  'ValidateConfigFiles': ValidateConfigFiles,
  'AssignServerRoles': AssignServerRoles,
  'GenericPlaceHolder': GenericPlaceHolder
};

/**
 * the default page order (with a placeholder state) for the pages in the wizard. If this is a mismatch
 * for the state object that comes back from the server , this list will override and the wizard
 * will start over at the begining
 */
export const expectedPageOrder = [{
  'index': 0,
  'state': 0,
  'jsxelement': 'InstallIntro'
}, {
  'index': 1,
  'state': 0,
  'jsxelement': 'CloudModelPicker'
}, {
  'index': 2,
  'state': 0,
  'jsxelement': 'CloudModelSummary'
}, {
  'index': 3,
  'state': 0,
  'jsxelement': 'AssignServerRoles'
}, {
  'index': 4,
  'state': 0,
  'jsxelement': 'ValidateConfigFiles'
}, {
  'index': 5,
  'state': 0,
  'jsxelement': 'GenericPlaceHolder'
}, {
  'index': 6,
  'state': 0,
  'jsxelement': 'GenericPlaceHolder'
}, {
  'index': 7,
  'state': 0,
  'jsxelement': 'ArdanaServerList'
}
];

/**
 * Checks two arrays of step objects against each other to make sure they're ordered the same
 * @param currentStateSteps
 * @param expectedOrder
 * @returns {boolean} true if the order matches, false otherwise
 */
export function stepsInOrder(currentStateSteps, expectedOrder) {
  var i;
  if(currentStateSteps.length !== expectedOrder.length) {
    return false;
  }

  for(i = 0; i < currentStateSteps.length; i++) {
    if(currentStateSteps[i].jsxelement !== expectedOrder[i].jsxelement) {
      return false;
    }
  }
  return true;
}
