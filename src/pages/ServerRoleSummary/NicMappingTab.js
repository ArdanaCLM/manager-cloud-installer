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
import { alphabetically } from '../../utils/Sort.js';
import { MODE } from '../../utils/constants.js';
import { ServerInput } from '../../components/ServerUtils.js';
import { ActionButton } from '../../components/Buttons.js';
import { List, Map } from 'immutable';
import { NetworkInterfaceValidator, PCIAddressValidator } from '../../utils/InputValidators.js';
import { YesNoModal } from '../../components/Modals.js';

class NicMappingTab extends Component {

  constructor(props) {
    super(props);

    this.state = {
      mode: MODE.NONE,
      activeRow: undefined,

      nicMappingName: '',

      isNameValid: true,
      // Since many fields on the form can be edited at the same time, the validity of
      // each field is tracked separately within the detail row entry
      detailRows: undefined,
    };
  }

  // Returns a new model with the nic mappings in sorted order
  getSortedModel = () => {
    return this.props.model.updateIn(['inputModel','nic-mappings'],
      list => list.sort((a,b) => alphabetically(a.get('name'), b.get('name'))));
  }

  // Returns the nic mapping rows from the model in sorted order
  getRows = () => {
    return this.getSortedModel().getIn(['inputModel','nic-mappings']);
  }

  addNicMapping = (e) => {
    e.preventDefault();

    // Prevent adding while editing is in progress
    if (this.state.mode !== MODE.NONE)
      return;

    this.setState({
      mode: MODE.ADD,
      isNameValid: false,
      nicMappingName: '',
      detailRows: List().push(this.newDetailRow())
    });
  }

  editNicMapping = (e, idx) => {
    e.preventDefault();

    // Prevent editing while editing / adding is in progress
    if (this.state.mode !== MODE.NONE)
      return;

    this.setState({
      mode: MODE.EDIT,
      activeRow: idx,
      isNameValid: true,
      nicMappingName: this.getRows().getIn([idx, 'name']),
      detailRows: this.getRows().getIn([idx, 'physical-ports']).map(e =>
        e.set('isBusAddressValid', true).set('isLogicalNameValid', true))
    });
  }

  deleteNicMapping = (idx) => {

    // Prevent deleting while editing / adding is in progress
    if (this.state.mode !== MODE.NONE)
      return;

    const model = this.getSortedModel().removeIn(['inputModel', 'nic-mappings', idx]);
    this.props.updateGlobalState('model', model);
  }

  handleNameChange = (e, valid) => {
    this.setState({
      nicMappingName: e.target.value,
      isNameValid: valid
    });
  }

  isFormValid = () => this.state.isNameValid && this.state.detailRows.every(e =>
    e.get('isBusAddressValid') && e.get('isLogicalNameValid'))

  newDetailRow = () => Map({
    'logical-name':'',
    'bus-address':'',
    isLogicalNameValid: false,
    isBusAddressValid: false,
  });

  newValidityRow = () => Map({
    'logical-name': false,
    'bus-address': false,
  });

  addDetailRow = () => {
    this.setState(prev => ({detailRows: prev.detailRows.push(this.newDetailRow())}));
  }

  removeDetailRow = (idx) => {
    // Remove the row. If it was the last row, add a new empty one
    this.setState(prev => {
      let rows = prev.detailRows.delete(idx);
      if (rows.size === 0) {
        rows = rows.push(this.newDetailRow());
      }
      return {detailRows: rows};
    });
  }

  updateDetailRow = (idx, field, value, valid) => {
    this.setState(prev => {

      let validityField;
      if (field === 'logical-name') {
        validityField = 'isLogicalNameValid';
      } else {
        validityField = 'isBusAddressValid';
      }

      return {detailRows: prev.detailRows.setIn([idx, field], value).setIn([idx, validityField], valid)};
    });
  }

  saveDetails = () => {
    let nicMap = Map({
      'name': this.state.nicMappingName,
      'physical-ports': this.state.detailRows.map(e => e.set('type','simple-port')
        .delete('isLogicalNameValid').delete('isBusAddressValid'))
    });

    let model;

    if (this.state.mode === MODE.ADD) {
      model = this.props.model.updateIn(['inputModel', 'nic-mappings'], list => list.push(nicMap));
    } else {
      model = this.getSortedModel().setIn(['inputModel', 'nic-mappings', this.state.activeRow], nicMap);
    }

    this.props.updateGlobalState('model', model);
    this.setState({mode: MODE.NONE});
  }

  renderDetailRows() {
    return this.state.detailRows.map((row, idx, arr) => {
      const lastRow = (idx === arr.size-1);

      return (
        <div key={idx} className='dropdown-plus-minus'>
          <div className="field-container">
            <ServerInput
              inputAction={(e, valid) => this.updateDetailRow(idx, 'logical-name', e.target.value, valid)}
              inputType='text'
              inputValue={row.get('logical-name')}
              inputValidate={NetworkInterfaceValidator}
              isRequired='true'
              placeholder={translate('port.logical.name') + '*'} />

            <ServerInput
              inputAction={(e, valid) => this.updateDetailRow(idx, 'bus-address', e.target.value, valid)}
              inputType='text'
              inputValue={row.get('bus-address')}
              inputValidate={PCIAddressValidator}
              isRequired='true'
              placeholder={translate('pci.address') + '*'} />
          </div>

          <div className='plus-minus-container'>
            {(idx > 0 || row.get('logical-name') || row.get('bus-address')) ?
              <span key={this.props.name + 'minus'} className={'fa fa-minus left-sign'}
                onClick={() => this.removeDetailRow(idx)}/>
              : null}
            {(lastRow && row.get('isBusAddressValid') && row.get('isLogicalNameValid')) ?
              <span key={this.props.name + 'plus'} className={'fa fa-plus right-sign'}
                onClick={this.addDetailRow}/>
              : null}
          </div>
        </div>
      );
    });
  }

  renderDetails = () => {

    if (this.state.mode !== MODE.NONE) {
      let title;

      if (this.state.mode === MODE.EDIT) {
        title = translate('edit.nic.mapping');
      } else {
        title = translate('add.nic.mapping');
      }

      return (
        <div className='col-xs-4'>
          <div className='details-section'>
            <div className='details-header'>{title}</div>
            <div className='details-body'>

              <ServerInput isRequired='true' placeholder={translate('nic.mapping.name') + '*'}
                inputValue={this.state.nicMappingName} inputName='name' inputType='text'
                inputAction={this.handleNameChange} />

              {this.renderDetailRows()}

              <div className='btn-row details-btn'>
                <div className='btn-container'>

                  <ActionButton key='cancel' type='default'
                    clickAction={(e) => this.setState({mode: MODE.NONE})}
                    displayLabel={translate('cancel')}/>

                  <ActionButton key='save' clickAction={this.saveDetails}
                    displayLabel={translate('save')} isDisabled={!this.isFormValid()}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  confirmModal = () => {
    if (this.state.showRemoveConfirmation) {
      const name = this.getRows().getIn([this.state.activeRow, 'name']);

      return (
        <YesNoModal show={true}
          title={translate('warning')}
          yesAction={() => {this.deleteNicMapping(this.state.activeRow);
            this.setState({showRemoveConfirmation: false});} }
          noAction={() => this.setState({showRemoveConfirmation: false})}>
          {translate('details.nicmapping.confirm.remove', name)}
        </YesNoModal>

      );
    }
  }

  render() {

    let addClass = 'material-icons add-button';
    let editClass = 'glyphicon glyphicon-pencil edit-button';
    let removeClass = 'glyphicon glyphicon-trash remove-button';
    if (this.state.mode != MODE.NONE) {
      addClass += ' disabled';
      editClass += ' disabled';
      removeClass += ' disabled';
    }

    const rows = this.getRows()
      .map((m,idx) => {
        const numPorts = m.get('physical-ports').size;
        return (
          <tr key={idx}>
            <td>{m.get('name')}</td>
            <td>{numPorts}</td>
            <td>
              <div className='row-action-container'>
                <span className={editClass}
                  onClick={(e) => this.editNicMapping(e, idx)} />
                <span className={removeClass}
                  onClick={(e) => this.setState({activeRow: idx, showRemoveConfirmation: true})} />
              </div>
            </td>
          </tr>);
      });

    const actionRow = (
      <tr key='addNicMapping' className='action-row'>
        <td colSpan="3">
          <i className={addClass} onClick={this.addNicMapping}>add_circle</i>
          {translate('add.nic.mapping')}
        </td>
      </tr>
    );

    return (
      <div>
        <div className={this.state.mode !== MODE.NONE ? 'col-xs-8 verticalLine' : ''}>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('nic.mapping.name')}</th>
                <th>{translate('number.ports')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows}
              {actionRow}
            </tbody>
          </table>
        </div>
        {this.renderDetails()}
        {this.confirmModal()}
      </div>
    );
  }
}

export default NicMappingTab;
