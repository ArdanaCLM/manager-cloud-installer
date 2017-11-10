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
import { YesNoModal } from '../../components/Modals.js';
import { getModelIndexByName } from '../../components/ServerUtils.js';
import DiskModelDetails from './DiskModelDetails.js';

class DiskModelsTab extends Component {

  constructor(props) {
    super(props);
    this.state = {
      diskModel: '',
      showDiskModelDetails: false,
      showRemoveConfirmation: false,
      diskModelToRemove: '',
      extendedDetails: 0
    };
  }

  setExtendedDetails = (value) => {
    this.setState({extendedDetails: value});
  }

  addDiskModel = (e) => {
    if (!this.state.showDiskModelDetails) {
      this.setState({showDiskModelDetails: true, diskModel: '', extendedDetails: 1});
    }
  }
  editDiskModel = (selected) => {
    if (!this.state.showDiskModelDetails) {
      this.setState({showDiskModelDetails: true, diskModel: selected, extendedDetails: 1});
    }
  }

  confirmRemoveDiskModel = (name) => {
    if (!this.state.showDiskModelDetails) {
      this.setState({showRemoveConfirmation: true, diskModelToRemove: name});
    }
  }

  removeDiskModel = (name) => {
    this.setState({showRemoveConfirmation: false, diskModelToRemove: ''});
    const index = getModelIndexByName(this.props.model, 'disk-models', name);
    if (index !== -1) {
      const model = this.props.model.removeIn(['inputModel','disk-models', index]);
      this.props.updateGlobalState('model', model);
    }
  }

  hideDiskModelDetails = () => {
    this.setState({showDiskModelDetails: false, diskModel: ''});
  }

  render() {
    const rows = this.props.model.getIn(['inputModel','disk-models'])
      .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
      .map((m,idx) => {
        let numVolumeGroups = '-';
        if (m.has('volume-groups')) {
          numVolumeGroups = m.get('volume-groups').size;
        }
        let numDeviceGroups = '-';
        if (m.has('device-groups')) {
          numDeviceGroups = m.get('device-groups').size;
        }

        const name = m.get('name');
        const selected = {
          name: name,
          volumeGroups: m.has('volume-groups') ? m.get('volume-groups').toJS() : [],
          deviceGroups: m.has('device-groups') ? m.get('device-groups').toJS() : []
        };

        let editClass = 'glyphicon glyphicon-pencil edit-button';
        let removeClass = 'glyphicon glyphicon-trash remove-button';
        if (this.state.showDiskModelDetails) {
          editClass = editClass + ' disabled';
          removeClass = removeClass + ' disabled';
        }

        return (
          <tr key={idx}>
            <td>{name}</td>
            <td>{numVolumeGroups}</td>
            <td>{numDeviceGroups}</td>
            <td>
              <div className='row-action-container'>
                <span onClick={() => this.editDiskModel(selected)} className={editClass}/>
                <span onClick={() => this.confirmRemoveDiskModel(name)} className={removeClass}/>
              </div>
            </td>
          </tr>);
      });

    let addClass = 'material-icons add-button';
    addClass = this.state.showDiskModelDetails ? addClass + ' disabled' : addClass;
    let actionRow = (
      <tr key='diskModelAction' className='action-row'>
        <td><i className={addClass} onClick={this.addDiskModel}>
          add_circle</i>{translate('add.disk.model')}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    );

    let detailsSection = '';
    if (this.state.showDiskModelDetails) {
      detailsSection = (<DiskModelDetails model={this.props.model}
        diskModel={this.state.diskModel} updateGlobalState={this.props.updateGlobalState}
        closeAction={this.hideDiskModelDetails} extendAction={this.setExtendedDetails}/>);
    }

    let confirmRemoveSection = '';
    if (this.state.showRemoveConfirmation) {
      confirmRemoveSection = (
        <YesNoModal show={this.state.showRemoveConfirmation} title={translate('warning')}
          yesAction={() => this.removeDiskModel(this.state.diskModelToRemove) }
          noAction={() => this.setState({showRemoveConfirmation: false})}>
          {translate('details.disk.model.confirm.remove', this.state.diskModelToRemove)}
        </YesNoModal>
      );
    }

    let extendedClass = 'extended-one';
    let widthClass = 'col-xs-12';
    if (this.state.showDiskModelDetails) {
      if (this.state.extendedDetails === 1) {
        widthClass = 'col-xs-8 verticalLine';
      } else if (this.state.extendedDetails === 2) {
        extendedClass = 'extended-two';
        widthClass = 'col-xs-6 verticalLine';
      } else if (this.state.extendedDetails === 3) {
        extendedClass = 'extended-three';
        widthClass = 'col-xs-5 verticalLine';
      }
    }

    return (
      <div className={extendedClass}>
        <div className={widthClass}>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('disk.model')}</th>
                <th>{translate('volume.groups')}</th>
                <th>{translate('device.groups')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows}
              {actionRow}
            </tbody>
          </table>
        </div>
        {detailsSection}
        {confirmRemoveSection}
      </div>
    );
  }
}

export default DiskModelsTab;
