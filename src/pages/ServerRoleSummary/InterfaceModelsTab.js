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
import { ServerInput } from '../../components/ServerUtils.js';
import Dropdown from '../../components/Dropdown.js';
import { ActionButton } from '../../components/Buttons.js';
import { alphabetically } from '../../utils/Sort.js';
import { MODE } from '../../utils/constants.js';
import { List, Map, Set, fromJS } from 'immutable';
import { YamlValidator } from '../../utils/InputValidators.js';
import { YesNoModal } from '../../components/Modals.js';
import { dump,  safeLoad } from 'js-yaml';
import { isEmpty } from 'lodash';

class InterfaceModelsTab extends Component {

  constructor(props) {
    super(props);

    this.state = {
      overallMode: MODE.NONE,
      detailMode: MODE.NONE,

      // index of the row in the main table being edited (interface model)
      activeOverallRow: undefined,
      // index of the row in the detail table being edited (interface)
      activeDetailRow: undefined,

      // interfaceModel being edited
      interfaceModel: undefined,

      // interface being edited (note: interface is a reserved word)
      networkInterface: undefined,

      // List of devices, bond device name, and bondOptions.  It would be preferable
      // to just edit these fields in the networkInterface object directly (like what
      // is done for the interface name), but there are some gotchas that prevent this:
      // 1. The device list/name is stored in different places (with different namaes)
      //    depending on the type of interface: for bonded interfaces the device list
      //    is stored within the bond-data sub-object, and the device name contains
      //    the bond device name.  For non-bonded interfaces, there is no bond-data, and
      //    the device name is stored in the device name field
      // 2. Bond options are stored in the object as a javascript object, but entered
      //    on the page as text.  Therefore if the bondOptions are being edited, they
      //    might be temporarily in a state that is not valid yaml, which would prevent
      //    it from being stored on the object.  Thus we use a string version to be
      //    used while editing is underway.
      deviceList: undefined,
      bondDeviceName: undefined,
      bondOptions: undefined,

      isInterfaceModelNameValid: undefined,
      isInterfaceNameValid: undefined,
      isBondDeviceNameValid: undefined,
      isBondOptionsValid: undefined,

      showRemoveInterfaceConfirmation: false,
      interfaceToRemoveIndex: undefined
    };
  }

  /*
   * Main section
   *
   * This section is responsible for handling the main table
   */

  // Returns a new model with the nic mappings in sorted order
  getSortedModel = () => {
    return this.props.model.updateIn(['inputModel','interface-models'],
      list => list.sort((a,b) => alphabetically(a.get('name'), b.get('name'))));
  }

  // Returns the interface mapping rows from the model in sorted order
  getRows = () => {
    return this.getSortedModel().getIn(['inputModel','interface-models']);
  }

  addModel = (e) => {
    e.preventDefault();

    // Prevent adding while editing is in progress
    if (this.state.overallMode !== MODE.NONE)
      return;

    this.setState({
      overallMode: MODE.ADD,
      isInterfaceModelNameValid: false,
      interfaceModel: fromJS({name: '', 'network-interfaces': []}),

      interfaceNames: List()
    });
  }

  editModel = (e, idx) => {

    // Prevent editing while editing / adding is in progress
    if (this.state.overallMode !== MODE.NONE)
      return;

    this.setState({
      overallMode: MODE.EDIT,
      activeOverallRow: idx,
      interfaceModel: this.getRows().get(idx),
      isInterfaceModelNameValid: true,
    });
  }

  deleteModel = (idx) => {

    // Prevent adding while editing is in progress
    if (this.state.overallMode !== MODE.NONE)
      return;

    const model = this.getSortedModel().removeIn(['inputModel', 'interface-models', idx]);
    this.props.updateGlobalState('model', model);
  }

  // Render the entire contents of the tab
  render() {
    let addClass = 'material-icons add-button';
    let editClass = 'glyphicon glyphicon-pencil edit-button';
    let removeClass = 'glyphicon glyphicon-trash remove-button';
    if (this.state.overallMode != MODE.NONE) {
      addClass += ' disabled';
      editClass += ' disabled';
      removeClass += ' disabled';
    }

    // build the rows in the main table
    const rows = this.getRows()
      .map((m,idx) => {
        return (
          <tr key={idx}>
            <td>{m.get('name')}</td>
            <td>{m.get('network-interfaces', new List()).size}</td>
            <td>
              <div className='row-action-container'>
                <span className={editClass}
                  onClick={(e) => this.editModel(e, idx)} />
                <span className={removeClass}
                  onClick={(e) => this.setState({activeOverallRow: idx, showRemoveConfirmation: true})} />
              </div>
            </td>
          </tr>);
      });

    // build the action row at the bottom of the main table
    const actionRow = (
      <tr key='addModel' className='action-row'>
        <td colSpan="3">
          <i className={addClass} onClick={this.addModel}>add_circle</i>
          {translate('add.interface.model')}
        </td>
      </tr>
    );

    let extendedClass = 'extended-one';
    let tableWidthClass = 'col-xs-12';
    let detailWidthClass = '';
    if (this.state.overallMode !== MODE.NONE) {
      if (this.state.detailMode === MODE.NONE) {
        tableWidthClass = 'col-xs-8 verticalLine';
        detailWidthClass = 'col-xs-4';
      } else {
        extendedClass = 'extended-two';
        tableWidthClass = 'col-xs-6 verticalLine';
        detailWidthClass = 'col-xs-6 multiple-details';
      }
    }

    return (
      <div className={extendedClass}>
        <div className={tableWidthClass}>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('interface.model')}</th>
                <th>{translate('network.interfaces')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows}
              {actionRow}
            </tbody>
          </table>
        </div>
        <div className={detailWidthClass}>
          {this.renderModelDetails()}
          {this.renderInterfaceDetails()}
        </div>
        {this.confirmModal()}
      </div>
    );
  }

  /*
   * Interface Model
   *
   * This section is responsible for handling the Interface Model area of the tab
   */

  handleInterfaceModelNameChange = (e, valid) => {
    const name = e.target.value;
    this.setState(prev => {
      return {
        interfaceModel: prev.interfaceModel.set('name', name),
        isInterfaceModelNameValid: valid
      };
    });
  }

  addInterface = (e) => {
    e.preventDefault();

    // Prevent adding while editing is in progress
    if (this.state.detailMode !== MODE.NONE)
      return;

    this.setState({
      detailMode: MODE.ADD,
      isInterfaceNameValid: false,

      networkInterface: fromJS({name: '', 'network-groups': [undefined]}),
      deviceList: List().push(Map({'name': undefined})),
      bondOptions: '',
      bondDeviceName: '',
      isBondDeviceNameValid: false,
      isBondOptionsValid: true
    });
  }

  editInterface = (e, idx) => {
    e.preventDefault();

    // Prevent adding while editing is in progress
    if (this.state.detailMode !== MODE.NONE)
      return;

    this.setState(prev => {

      let newState = {
        detailMode: MODE.EDIT,
        isInterfaceNameValid: true,
        activeDetailRow: idx
      };

      const networkInterface = prev.interfaceModel.getIn(['network-interfaces', idx]);
      newState.networkInterface = networkInterface;

      if (networkInterface.has('bond-data')) {
        newState.deviceList = networkInterface.getIn(['bond-data', 'devices']);

        if (networkInterface.getIn(['bond-data', 'options'])) {
          try {
            newState.bondOptions = dump(networkInterface.getIn(['bond-data', 'options']).toJS());
          } catch (e) {
            newState.bondOptions = '';
            console.log('Unable to dump bond-data as yaml :', e); // eslint-disable-line no-console
          }
        }
        newState.bondDeviceName = networkInterface.getIn(['device','name']);

      } else {

        newState.deviceList = List().push(networkInterface.get('device'));
        newState.bondOptions = '';
        newState.bondDeviceName = '';
      }

      newState.isBondOptionsValid = true;
      newState.isBondDeviceNameValid = ! isEmpty(newState.bondDeviceName);

      return newState;
    });
  }

  confirmRemoveInterface = (idx) => {
    // Prevent adding while editing is in progress
    if (this.state.detailMode !== MODE.NONE)
      return;

    this.setState({showRemoveInterfaceConfirmation: true, interfaceToRemoveIndex: idx});
  }

  removeInterface = () => {
    // Prevent adding while editing is in progress
    if (this.state.detailMode !== MODE.NONE)
      return;

    if (!isNaN(this.state.interfaceToRemoveIndex)) {
      this.setState(prev => {
        return {
          networkInterface: undefined,
          interfaceModel: prev.interfaceModel.deleteIn(['network-interfaces',
            this.state.interfaceToRemoveIndex]),
          interfaceToRemoveIndex: undefined,
          showRemoveInterfaceConfirmation: false
        };
      });
    }
  }


  saveModel = () => {
    // Update the global model with the changes
    let model;
    if (this.state.overallMode === MODE.ADD) {
      model = this.props.model.updateIn(['inputModel', 'interface-models'], list =>
        list.push(this.state.interfaceModel));
    }
    else {
      model = this.getSortedModel().setIn(['inputModel', 'interface-models', this.state.activeOverallRow],
        this.state.interfaceModel);
    }
    this.props.updateGlobalState('model', model);
    this.setState({overallMode: MODE.NONE});
  }


  isInterfaceModelValid = () => this.state.isInterfaceModelNameValid &&
    this.state.detailMode === MODE.NONE &&
    this.state.interfaceModel.get('network-interfaces').size > 0

  // Render the first detail box, which is for editing interface model details
  renderModelDetails = () => {

    if (this.state.overallMode !== MODE.NONE) {
      const title = this.state.overallMode === MODE.EDIT ?  translate('edit.interface.model')
        : translate('add.interface.model');

      const interfaces = this.state.interfaceModel.get('network-interfaces').map((e,idx) => {

        let minus, edit;
        //if (idx === arr.size-1 && this.state.deviceList.get(idx).get('name')) {
        let editClass = 'glyphicon glyphicon-pencil edit-button left-sign';
        let minusClass = 'glyphicon glyphicon-trash right-sign';
        if (this.state.detailMode !== MODE.NONE) {
          editClass += ' disabled';
          minusClass += ' disabled';
        }
        edit = (<span key='edit' className={editClass}
          onClick={(e) => this.editInterface(e, idx)}/>);
        //}
        //if (idx > 0 || this.state.deviceList.get(idx).get('name')) {
        minus = (<span key='remove' className={minusClass}
          onClick={(e) => this.confirmRemoveInterface(idx)}/>);
        //}

        return (
          <div key={idx} className='dropdown-plus-minus'>
            <ServerInput isRequired='true' placeholder={translate('interface.name') + '*'}
              inputValue={e.get('name')} inputType='text' disabled='true' />
            <div className='plus-minus-container'> {edit} {minus} </div>
          </div>
        );
      });

      let addClass = 'material-icons add-button';
      let widthClass = '';
      let buttonClass = 'btn-container';
      if (this.state.detailMode !== MODE.NONE) {
        addClass += ' disabled';
        widthClass = 'col-xs-6 verticalLine';
        buttonClass += ' hide';
      }

      const addButton = (
        <div className='action-column'>
          <i className={addClass} onClick={this.addInterface}>add_circle</i>
          {translate('add.network.interface')}
        </div>);

      return (
        <div className={widthClass}>
          <div className='details-section'>
            <div className='details-header'>{title}</div>
            <div className='details-body'>

              <ServerInput isRequired='true' placeholder={translate('interface.model.name') + '*'}
                inputValue={this.state.interfaceModel.get('name')} inputName='modelname'
                inputType='text' inputAction={this.handleInterfaceModelNameChange}
                disabled={this.state.detailMode !== MODE.NONE}/>
              <div className='details-group-title'>{translate('network.interfaces') + ':'}</div>
              {interfaces}
              {addButton}

              <div className='btn-row details-btn'>
                <div className={buttonClass}>
                  <ActionButton key='cancel' type='default'
                    clickAction={(e) => this.setState({overallMode: MODE.NONE})}
                    displayLabel={translate('cancel')}
                    isDisabled={this.state.detailMode !== MODE.NONE} />

                  <ActionButton key='save' clickAction={this.saveModel}
                    displayLabel={translate('save')} isDisabled={!this.isInterfaceModelValid()}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  /*
   * Network Interface
   *
   * This section is responsible for handling the Network Interface section of the tab.
   */

  handleInterfaceNameChange = (e, valid) => {
    const name = e.target.value;
    this.setState(prev => {
      return {
        networkInterface: prev.networkInterface.set('name', name),
        isInterfaceNameValid: valid
      };
    });
  }

  handleBondDeviceNameChange = (value, valid) => {
    this.setState({
      bondDeviceName: value,
      isBondDeviceNameValid: valid
    });
  }

  handleBondOptionsChange = (value, valid) => {
    this.setState({
      bondOptions: value,
      isBondOptionsValid: valid
    });
  }

  saveNetworkInterface = () => {
    this.setState(prev => {
      let networkInterface = prev.networkInterface;
      if (networkInterface.has('bond-data')) {

        networkInterface = networkInterface
          .setIn(['bond-data', 'devices'], prev.deviceList)
          .setIn(['device', 'name'], prev.bondDeviceName);

        try {
          networkInterface = networkInterface.setIn(['bond-data', 'options'], safeLoad(prev.bondOptions));
        } catch (e) {
          console.log('Unable to load bond-data from yaml :', e); // eslint-disable-line no-console
        }
      } else {
        networkInterface = networkInterface.set('device', prev.deviceList.get(0));
      }

      let interfaceModel;
      if (prev.detailMode === MODE.ADD) {
        interfaceModel = prev.interfaceModel.updateIn(['network-interfaces'], list =>
          list.push(networkInterface));
      } else {
        interfaceModel = prev.interfaceModel.setIn(['network-interfaces', prev.activeDetailRow], networkInterface);
      }


      return {
        detailMode: MODE.NONE,
        interfaceModel: interfaceModel,
        networkInterface: undefined,
      };
    });
  }

  isNetworkInterfaceValid = () =>
    this.state.isInterfaceNameValid &&
    this.state.deviceList.last().get('name') !== undefined &&
    this.state.networkInterface.get('network-groups').last() !== undefined &&
    (! this.state.networkInterface.has('bond-data') || (
      this.state.isBondOptionsValid  &&
      this.state.isBondDeviceNameValid
    ))

  // Render the second detail box, which is for editing interface details
  renderInterfaceDetails = () => {
    if (this.state.overallMode !== MODE.NONE && this.state.detailMode !== MODE.NONE) {
      let title;
      if (this.state.detailMode === MODE.ADD) {
        title = translate('add.network.interface');
      } else {
        title = translate('edit.network.interface');
      }

      return (
        <div className='col-xs-6'>
          <div className='details-section'>
            <div className='details-header'>{title}</div>
            <div className='details-body'>

              <ServerInput isRequired='true' placeholder={translate('interface.name')}
                inputValue={this.state.networkInterface.get('name')} inputName='interfacename'
                inputAction={this.handleInterfaceNameChange}
                autoFocus="true" />
              <div className='details-group-title'>{translate('network.device') + ':'}</div>
              {this.renderDevices()}
              <div className='details-group-title'>{translate('network.group') + ':'}</div>
              {this.renderNetworkGroups()}

              {this.state.networkInterface.has('bond-data') ?
                <div>
                  <div className='details-group-title'>{translate('bond.device.name') + '* :'}</div>
                  <ServerInput required='true' placeholder={translate('bond.device.name')}
                    inputValue={this.state.bondDeviceName} inputName='bonddevicename'
                    inputAction={(e, valid) => this.handleBondDeviceNameChange(e.target.value, valid)}
                  />
                </div>
                : undefined}

              {this.state.networkInterface.has('bond-data') ?
                <div>
                  <div className='details-group-title'>{translate('bond.options') + ':'}</div>
                  <ServerInput placeholder={translate('bond.options')}
                    inputValue={this.state.bondOptions} inputName='bondoptions'
                    inputType='textarea'
                    inputValidate={YamlValidator}
                    inputAction={(e, valid) => this.handleBondOptionsChange(e.target.value, valid)}
                  />
                </div>
                : undefined}

              <div className='btn-row details-btn'>
                <div className='btn-container'>

                  <ActionButton key='cancel' type='default'
                    clickAction={(e) => this.setState({detailMode: MODE.NONE})}
                    displayLabel={translate('cancel')}/>

                  <ActionButton key='save' clickAction={this.saveNetworkInterface}
                    displayLabel={translate('save')} isDisabled={!this.isNetworkInterfaceValid()}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  /*
   * Network Device Logic
   *
   * This section is responsible for handling the network device dropdown box on the Network Interface
   * details section.  Note that multiple such dropdowns may exist for a given Network Interface
   */
  addDevice = () => {

    // add a new row if the last row has a selection
    this.setState(prev => {
      let newState = {};
      if (prev.deviceList.last().get('name')) {
        newState.deviceList = prev.deviceList.push(Map({name: undefined}));

        if (! prev.networkInterface.has('bond-data')) {
          newState.networkInterface = prev.networkInterface.set('bond-data',
            Map({options: {}, provider: 'linux'}));
        }
      }

      return newState;
    });
  }

  removeDevice = (idx) => {
    // Remove the row. If it was the last row, add a new empty one
    this.setState(prev => {

      let newState = {};

      let rows = prev.deviceList.delete(idx);
      if (rows.size === 0) {
        rows = rows.push(Map({name: undefined}));
      }
      if (rows.size < 2) {
        newState.networkInterface = prev.networkInterface.delete('bond-data');
      }
      newState.deviceList = rows;

      return newState;
    });
  }

  updateDevice = (val) => {
    this.setState(prev => {
      // replace the last item in the device list with a new one containing val
      return {deviceList: prev.deviceList.pop().push(Map({'name': val}))};
    });
  }

  renderDevices = () => {
    // Build list of logic ports from the nic-mapping section of the model to serve as the
    // contents of the dropdown
    let logicalNames = this.props.model.getIn(['inputModel', 'nic-mappings'])  // Get list of nic-mapping objects
      .map(e => e.get('physical-ports')           // Extract out the physical-ports entry (whose value is list)
        .map(e => e.get('logical-name')))         // Extract the logical-name entry from physical-ports list
      .flatten();                                 // Create a single-dimensional list out of above nested list

    const options = List(Set(logicalNames)).sort()  // Remove duplicates (by converting to a set) and sort
      .map(opt => <option key={opt} value={opt}>{opt}</option>);   // create <option> list for dropdown list

    return this.state.deviceList.map((row,idx, arr) => {

      let minus, plus;
      if (idx === arr.size-1 && this.state.deviceList.get(idx).get('name')) {
        plus = (<span key={this.props.name + 'plus'} className={'fa fa-plus right-sign'}
          onClick={this.addDevice}/>);
      }
      if (idx > 0 || this.state.deviceList.get(idx).get('name')) {
        minus = (<span key={this.props.name + 'minus'} className={'fa fa-minus left-sign'}
          onClick={() => this.removeDevice(idx)}/>);
      }

      return (
        <div key={idx} className='dropdown-plus-minus'>
          <Dropdown
            value={this.state.deviceList.get(idx).get('name')}
            onChange={(e) => this.updateDevice(e.target.value, idx)}
            emptyOption={translate('none')}>

            {options}

          </Dropdown>
          <div className='plus-minus-container'> {minus} {plus} </div>
        </div>
      );
    });
  }

  /*
   * Network Group Logic
   *
   * This section is responsible for handling the network group dropdown box on the Network Interface
   * details section.  Note that multiple such dropdowns may exist for a given Network Interface
   */

  addNetworkGroup = () => {
    // add a new row if the last row has a selection
    this.setState(prev => {
      return {networkInterface: prev.networkInterface.updateIn(['network-groups'], list => list.push(undefined))};
    });
  }

  removeNetworkGroup = (idx) => {
    // Remove the row. If it was the last row, add a new empty one
    this.setState(prev => {

      let newInterface = prev.networkInterface.deleteIn(['network-groups', idx]);

      if (newInterface.get('network-groups').size === 0) {
        newInterface = newInterface.updateIn(['network-groups'], list => list.push(undefined));
      }

      return {networkInterface: newInterface};
    });
  }

  updateNetworkGroup = (val, idx) => {
    // Update the selected model with the value the user has chosen
    this.setState(prev => {
      return {networkInterface: prev.networkInterface.setIn(['network-groups', idx], val)};
    });
  }

  renderNetworkGroups = () => {

    // Build the list of options in each combo box, which are the values of the
    // network-group names from the input model
    const options = this.props.model.getIn(['inputModel', 'network-groups'])
      .map(e => e.get('name'))
      .sort()
      .map(opt => <option key={opt} value={opt}>{opt}</option>);


    // Render a combo box for each network group
    return this.state.networkInterface.get('network-groups').map((row,idx, arr) => {

      let minus, plus;
      // Render a plus only on the last row, and only if a valid value has been selected
      if (idx === arr.size-1 && this.state.networkInterface.getIn(['network-groups', idx])) {
        plus = (<span key={this.props.name + 'plus'} className={'fa fa-plus right-sign'}
          onClick={this.addNetworkGroup}/>);
      }
      // Render a minus on every row except the first for when no valid value has been selected
      if (idx > 0 || this.state.networkInterface.getIn(['network-groups', idx])) {
        minus = (<span key={this.props.name + 'minus'} className={'fa fa-minus left-sign'}
          onClick={() => this.removeNetworkGroup(idx)}/>);
      }

      return (
        <div key={idx} className='dropdown-plus-minus'>
          <Dropdown
            value={this.state.networkInterface.getIn(['network-groups', idx])}
            onChange={(e) => this.updateNetworkGroup(e.target.value, idx)}
            emptyOption={translate('none')}>

            {options}

          </Dropdown>
          <div className='plus-minus-container'> {minus} {plus} </div>
        </div>
      );
    });
  }

  confirmModal = () => {
    // Present a confirmation dialog before deleting a network interface model
    if (this.state.showRemoveConfirmation) {
      const name = this.getRows().getIn([this.state.activeOverallRow, 'name']);

      return (
        <YesNoModal show={true}
          title={translate('warning')}
          yesAction={() => {this.deleteModel(this.state.activeOverallRow);
            this.setState({showRemoveConfirmation: false});} }
          noAction={() => this.setState({showRemoveConfirmation: false})}>
          {translate('details.interfacemodel.confirm.remove', name)}
        </YesNoModal>

      );
    } else if (this.state.showRemoveInterfaceConfirmation) {
      const name = this.state.interfaceModel.get('network-interfaces')
        .get(this.state.interfaceToRemoveIndex).get('name');

      return (
        <YesNoModal show={true}
          title={translate('warning')}
          yesAction={(e) => this.removeInterface()}
          noAction={() => this.setState({showRemoveInterfaceConfirmation: false,
            interfaceToRemoveIndex: undefined})}>
          {translate('details.interface.confirm.remove', name)}
        </YesNoModal>
      );
    }
  }
}

export default InterfaceModelsTab;
