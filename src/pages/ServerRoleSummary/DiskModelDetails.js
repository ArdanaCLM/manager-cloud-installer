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
import { fromJS } from 'immutable';
import { translate } from '../../localization/localize.js';
import { ServerInput, getModelIndexByName } from '../../components/ServerUtils.js';
import { ActionButton } from '../../components/Buttons.js';
import { UniqueNameValidator } from '../../utils/InputValidators.js';
import { InlineAddRemoveInput } from '../../components/InlineAddRemoveFields.js';
import { alphabetically } from '../../utils/Sort.js';
import { MODE } from '../../utils/constants.js';

class DiskModelDetails extends Component {
  constructor(props) {
    super(props);
    if (props.diskModel === '') {
      // add mode
      this.state = {
        diskModelName: '',
        volumeGroups: [],
        deviceGroups: [],
        volumeGroup: {},
        logicalVolume: {},
        physicalVolumes: [],
        logicalVolumes: [],
        deviceGroup: {},
        deviceGroupDevices: [],
        deviceGroupConsumer: {},
        showThirdDetails: false
      };
      this.dmMode = MODE.ADD;
    } else {
      // edit mode
      this.state = {
        diskModelName: props.diskModel.name,
        volumeGroups: JSON.parse(JSON.stringify(props.diskModel.volumeGroups)),
        deviceGroups: JSON.parse(JSON.stringify(props.diskModel.deviceGroups)),
        volumeGroup: {},
        logicalVolume: {},
        physicalVolumes: [],
        logicalVolumes: [],
        deviceGroup: {},
        deviceGroupDevices: [],
        deviceGroupConsumer: {},
        showThirdDetails: false
      };
      this.dmMode = MODE.EDIT;
      this.origDKName = props.diskModel.name;
      this.origVGs = JSON.parse(JSON.stringify(props.diskModel.volumeGroups.sort(
        (a,b) => alphabetically(a.name, b.name))));
      this.origDGs = JSON.parse(JSON.stringify(props.diskModel.deviceGroups.sort(
        (a,b) => alphabetically(a.name, b.name))));
    }
    this.secondDetails = '';
  }

  handleInputLine = (e, valid, props) => {
    const value = e.target.value;
    if (e.target.name === 'dmName') {
      this.setState({diskModelName: value});
    } else if (e.target.name === 'vgName') {
      this.setState({volumeGroup: {name: value}});
    } else if (e.target.name === 'dgName') {
      this.setState({deviceGroup: {name: value}});
    } else if (e.target.name === 'lvName') {
      this.setState(prevState => {
        let newLV = prevState.logicalVolume;
        newLV.name = value;
        return {logicalVolume: newLV};
      });
    } else if (e.target.name === 'lvSize') {
      this.setState(prevState => {
        let newLV = prevState.logicalVolume;
        newLV.size = value;
        return {logicalVolume: newLV};
      });
    } else if (e.target.name === 'lvFstype') {
      this.setState(prevState => {
        let newLV = prevState.logicalVolume;
        newLV.fstype = value;
        return {logicalVolume: newLV};
      });
    } else if (e.target.name === 'lvMount') {
      this.setState(prevState => {
        let newLV = prevState.logicalVolume;
        newLV.mount = value;
        return {logicalVolume: newLV};
      });
    } else if (e.target.name === 'lvMkfs') {
      this.setState(prevState => {
        let newLV = prevState.logicalVolume;
        newLV['mkfs-opts'] = value;
        return {logicalVolume: newLV};
      });
    } else if (e.target.name === 'dgConsumerName') {
      this.setState(prevState => {
        let newDGConsumer = prevState.deviceGroupConsumer;
        newDGConsumer.name = value;
        return {deviceGroupConsumer: newDGConsumer};
      });
    } else if (e.target.name === 'dgConsumerUsage') {
      this.setState(prevState => {
        let newDGConsumer = prevState.deviceGroupConsumer;
        newDGConsumer.usage = value;
        return {deviceGroupConsumer: newDGConsumer};
      });
    } else if (e.target.name === 'dgConsumerAttrs') {
      this.setState(prevState => {
        let newDGConsumer = prevState.deviceGroupConsumer;
        newDGConsumer.attrs = value;
        return {deviceGroupConsumer: newDGConsumer};
      });
    }
  }

  addVolumeGroup = () => {
    if (this.secondDetails === '' && !this.state.showThirdDetails) {
      this.props.extendAction(2);
      this.secondDetails = 'vg';
      this.vgMode = MODE.ADD;
    }
  }

  editVolumeGroup = (selected) => {
    if (this.secondDetails === '' && !this.state.showThirdDetails) {
      this.setState({
        volumeGroup: selected,
        physicalVolumes: selected['physical-volumes'].slice(),
        logicalVolumes: selected['logical-volumes'].slice()
      });
      this.props.extendAction(2);
      this.secondDetails = 'vg';
      this.vgMode = MODE.EDIT;
      this.origVGName = selected.name;
      this.origVGPhysicalVolumes = selected['physical-volumes'].slice().sort();
      this.origVGLogicalVolumes = selected['logical-volumes'].slice().sort();
    }
  }

  renderVolumeGroup = () => {
    const removeClass = !this.state.showThirdDetails ? 'glyphicon glyphicon-trash right-sign' :
      'glyphicon glyphicon-trash right-sign disabled';
    const editClass = !this.state.showThirdDetails ? 'glyphicon glyphicon-pencil left-sign' :
      'glyphicon glyphicon-pencil left-sign disabled';
    let logicalVolumeLines = [];
    let textFields = this.state.logicalVolumes.slice();
    textFields.map((lv, index) => {
      logicalVolumeLines.push(
        <div className='dropdown-plus-minus' key={lv + index}>
          <ServerInput key={lv.name + index} inputType='text' inputValue={lv.name}
            disabled='true'/>
          <div className='plus-minus-container'>
            <span key={lv.name + 'edit' + index} className={editClass}
              onClick={() => this.editLogicalVolume(lv)}/>
            <span key={lv + 'minus' + index} className={removeClass}
              onClick={() => this.removeLogicalVolume(index)}/>
          </div>
        </div>
      );
    });

    let addClass = 'material-icons add-button';
    addClass = this.state.showThirdDetails ? addClass + ' disabled' : addClass;
    return (
      <div>
        <div className='details-group-title'>{translate('physical.volume') + '*:'}</div>
        <InlineAddRemoveInput name='pv' placeholder={translate('physical.volume')}
          values={this.state.physicalVolumes} sendSelectedList={this.getSelectedPhysicalVolumes}
          disabled={this.state.showThirdDetails}/>
        <div className='details-group-title'>{translate('logical.volume') + '*:'}</div>
        {logicalVolumeLines}
        <div className='action-column' key='addLV'>
          <i className={addClass} onClick={this.addLogicalVolume}>add_circle</i>
          {translate('add.logical.volume')}</div>
      </div>
    );
  }

  getSelectedPhysicalVolumes = (list) => {
    this.setState({physicalVolumes: list});
  }

  addLogicalVolume = () => {
    if (!this.state.showThirdDetails) {
      this.setState({showThirdDetails: true});
      this.props.extendAction(3);
      this.lvMode = MODE.ADD;
      this.origLV = {
        name: '',
        size: '',
        mount: '',
        fstype: '',
        'mkfs-opts': ''
      };
    }
  }

  editLogicalVolume = (selected) => {
    if (!this.state.showThirdDetails) {
      // remove '%' from size to display in the input field
      let lvSize = selected.size;
      if (selected.size.indexOf('%') !== -1) {
        lvSize = selected.size.substring(0, lvSize.indexOf('%'));
      }
      this.origLV = {
        name: selected.name,
        size: lvSize,
        mount: selected.mount || '',
        fstype: selected.fstype || '',
        'mkfs-opts': selected['mkfs-opts'] || ''
      };
      this.setState({showThirdDetails: true, logicalVolume: Object.assign({}, this.origLV)});
      this.props.extendAction(3);
      this.lvMode = MODE.EDIT;
    }
  }

  renderLogicalVolume = () => {
    if (this.state.showThirdDetails) {
      const header = this.lvMode === MODE.ADD ? translate('add.logical.volume') :
        translate('edit.logical.volume');
      return (
        <div className='col-xs-4 details-section second-details'>
          <div className='details-header'>{header}</div>
          <div className='details-body'>
            <ServerInput isRequired={true} placeholder={translate('logical.volume.name') + '*'}
              inputValue={this.state.logicalVolume.name || ''} inputName='lvName' inputType='text'
              inputAction={this.handleInputLine} autoFocus={true}/>
            <ServerInput isRequired={true} placeholder={translate('logical.volume.size')}
              inputValue={this.state.logicalVolume.size || ''} inputName='lvSize' inputType='number'
              inputAction={this.handleInputLine} {...{min: 0, max: 100}}/>
            <ServerInput placeholder={translate('logical.volume.mount')} inputType='text'
              inputValue={this.state.logicalVolume.mount || ''} inputName='lvMount'
              inputAction={this.handleInputLine}/>
            <ServerInput placeholder={translate('logical.volume.fstype')} inputType='text'
              inputValue={this.state.logicalVolume.fstype || ''} inputName='lvFstype'
              inputAction={this.handleInputLine}/>
            <ServerInput placeholder={translate('logical.volume.mkfs')} inputType='text'
              inputValue={this.state.logicalVolume['mkfs-opts'] || ''} inputName='lvMkfs'
              inputAction={this.handleInputLine}/>
            <div className='btn-row details-btn'>
              <div className='btn-container'>
                <ActionButton key='cancel' type='default' clickAction={this.closeThirdDetails}
                  displayLabel={translate('cancel')}/>
                <ActionButton key='save' clickAction={this.saveLogicalVolume}
                  displayLabel={translate('save')} isDisabled={!this.checkLVDataToSave()}/>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  checkLVDataToSave = () => {
    if (this.lvMode === MODE.ADD) {
      return this.state.logicalVolume.name !== undefined && this.state.logicalVolume.name !== '' &&
        this.state.logicalVolume.size !== undefined && this.state.logicalVolume.size !== '' &&
        this.state.logicalVolume.size !== '0';
    } else {
      return this.state.logicalVolume.name !== '' &&
        this.state.logicalVolume.size !== '' && this.state.logicalVolume.size !== '0' &&
        (this.state.logicalVolume.name !== this.origLV.name ||
         this.state.logicalVolume.size !== this.origLV.size ||
         this.state.logicalVolume.mount !== this.origLV.mount ||
         this.state.logicalVolume.fstype !== this.origLV.fstype ||
         this.state.logicalVolume['mkfs-opts'] !== this.origLV['mkfs-opts']);
    }
  }

  closeThirdDetails = () => {
    this.props.extendAction(2);
    this.setState({showThirdDetails: false, logicalVolume: {}});
  }

  saveLogicalVolume = () => {
    this.props.extendAction(2);
    this.setState(prevState => {
      let newLVs = prevState.logicalVolumes.slice();
      let newLV = this.state.logicalVolume;
      newLV.size = this.state.logicalVolume.size + '%';
      if (this.lvMode === MODE.ADD) {
        newLVs.push(newLV);
      } else {
        const index = newLVs.findIndex(lv => lv.name === this.origLV.name);
        if (index !== -1) {
          newLVs[index] = newLV;
        }
      }
      return {logicalVolumes: newLVs, logicalVolume: {}, showThirdDetails: false};
    });
  }

  removeLogicalVolume = (index) => {
    if (!this.state.showThirdDetails) {
      this.setState(prevState => {
        let newLVs = prevState.logicalVolumes.slice();
        newLVs.splice(index, 1);
        return {logicalVolumes: newLVs};
      });
    }
  }

  addDeviceGroup = () => {
    if (this.secondDetails === '' && !this.state.showThirdDetails) {
      this.props.extendAction(2);
      this.secondDetails = 'dg';
      this.dgMode = MODE.ADD;
    }
  }

  editDeviceGroup = (selected) => {
    if (this.secondDetails === '' && !this.state.showThirdDetails) {
      this.setState({
        deviceGroup: selected,
        deviceGroupDevices: selected.devices.map((device) => {return device.name;}),
        deviceGroupConsumer: selected.consumer,
      });
      this.props.extendAction(2);
      this.secondDetails = 'dg';
      this.dgMode = MODE.EDIT;
      this.origDGName = selected.name;
      this.origDGDevices = selected.devices.map((device) => {return device.name;}).sort();
      this.origDGConsumer = selected.consumer;
    }
  }

  renderDeviceGroup = () => {
    return (
      <div>
        <div className='details-group-title'>{translate('device.group.devices') + ':'}</div>
        <InlineAddRemoveInput name='dgdevices' placeholder={translate('device.group.device') + '*'}
          values={this.state.deviceGroupDevices} sendSelectedList={this.getSelectedDGDevices}/>
        <div className='details-group-title'>{translate('device.group.consumer') + ':'}</div>
        <ServerInput isRequired={true} placeholder={translate('device.group.consumer.name') + '*'}
          inputValue={this.state.deviceGroupConsumer.name || ''} inputName='dgConsumerName'
          inputType='text' inputAction={this.handleInputLine}/>
        <ServerInput placeholder={translate('device.group.consumer.usage')}
          inputValue={this.state.deviceGroupConsumer.usage || ''} inputName='dgConsumerUsage'
          inputType='text' inputAction={this.handleInputLine}/>
        <ServerInput placeholder={translate('device.group.consumer.attrs')}
          inputValue={this.state.deviceGroupConsumer.attrs || ''} inputName='dgConsumerAttrs'
          inputType='text' inputAction={this.handleInputLine}/>
      </div>
    );
  }

  getSelectedDGDevices = (list) => {
    this.setState({deviceGroupDevices: list});
  }

  checkSecondDetailsDataToSave = () => {
    if (this.secondDetails === 'vg') {
      if (this.vgMode === MODE.ADD) {
        return this.state.volumeGroup.name && this.state.volumeGroup.name !== '' &&
          this.state.physicalVolumes.length > 0 && this.state.logicalVolumes.length > 0;
      } else {
        const pvs = this.state.physicalVolumes.slice().sort();
        return (this.state.volumeGroup.name && this.state.volumeGroup.name !== '' &&
          this.state.physicalVolumes.length > 0 && this.state.logicalVolumes.length > 0) &&
          (this.state.volumeGroup.name !== this.origVGName ||
          JSON.stringify(pvs) !== JSON.stringify(this.origVGPhysicalVolumes) ||
          JSON.stringify(this.state.logicalVolumes) !== JSON.stringify(this.origVGLogicalVolumes));
      }
    } else {
      if (this.dgMode === MODE.ADD) {
        return this.state.deviceGroup.name && this.state.deviceGroup.name !== '' &&
          this.state.deviceGroupConsumer.name && this.state.deviceGroupConsumer.name !== '' &&
          this.state.deviceGroupDevices.length > 0 &&
          ((this.state.deviceGroupConsumer.usage && this.state.deviceGroupConsumer.usage !== '') ||
           (this.state.deviceGroupConsumer.attrs && this.state.deviceGroupConsumer.attrs !== ''));
      } else {
        const devices = this.state.deviceGroupDevices.slice().sort();
        return (this.state.deviceGroup.name && this.state.deviceGroup.name !== '' &&
          this.state.deviceGroupConsumer.name && this.state.deviceGroupConsumer.name !== '' &&
          this.state.deviceGroupDevices.length > 0 &&
          ((this.state.deviceGroupConsumer.usage && this.state.deviceGroupConsumer.usage !== '') ||
           (this.state.deviceGroupConsumer.attrs && this.state.deviceGroupConsumer.attrs !== ''))) &&
          (this.state.deviceGroup.name !== this.origDGName ||
           JSON.stringify(devices) !== JSON.stringify(this.origDGDevices) ||
           this.state.deviceGroupConsumer.name !== this.origDGConsumer.name ||
           this.state.deviceGroupConsumer.usage !== this.origDGConsumer.usage ||
           this.state.deviceGroupConsumer.attrs !== this.origDGConsumer.attrs);
      }
    }
  }

  saveSecondDetails = () => {
    if (this.secondDetails === 'vg') {
      this.setState(prevState => {
        let newVG = prevState.volumeGroup;
        newVG['physical-volumes'] = prevState.physicalVolumes.slice();
        newVG['logical-volumes'] = prevState.logicalVolumes.slice();
        let newVGs = prevState.volumeGroups;
        if (this.vgMode === MODE.ADD) {
          newVGs.push(newVG);
        } else {
          const index = this.state.volumeGroups.findIndex(vg => vg.name === this.origVGName);
          if (index !== -1) {
            newVGs[index] = newVG;
            this.origVGName = '';
            this.origVGPhysicalVolumes = [];
            this.origVGLogicalVolumes = [];
          }
        }
        return {
          volumeGroups: newVGs
        };
      });
    } else {
      this.setState(prevState => {
        let newDG = prevState.deviceGroup;
        newDG.consumer = prevState.deviceGroupConsumer;
        newDG.devices = prevState.deviceGroupDevices.map((device) => {return {name: device};});
        let newDGs = prevState.deviceGroups;
        if (this.dgMode === MODE.ADD) {
          newDGs.push(newDG);
        } else {
          const index = this.state.deviceGroups.findIndex(dg => dg.name === this.origDGName);
          if (index !== -1) {
            newDGs[index] = newDG;
            this.origDGName = '';
            this.origDGDevices = [];
            this.origDGConsumer = {};
          }
        }
        return {
          deviceGroups: newDGs
        };
      });
    }
    this.closeSecondDetails();
  }

  closeSecondDetails = () => {
    this.setState({
      volumeGroup: {},
      physicalVolumes: [],
      logicalVolumes: [],
      deviceGroup: {},
      deviceGroupDevices: [],
      deviceGroupConsumer: {}
    });
    this.props.extendAction(1);
    this.secondDetails = '';
  }

  renderSecondDetails = () => {
    if (this.secondDetails !== '') {
      let header, placeholder, secondDetailsLines, groupName, value;
      if (this.secondDetails === 'vg') {
        header = (this.vgMode === MODE.ADD) ? translate('add.volume.group') :
          translate('edit.volume.group');
        placeholder = translate('volume.group.name') + '*';
        secondDetailsLines = this.renderVolumeGroup();
        groupName = 'vgName';
        value = this.state.volumeGroup.name || '';
      } else {
        header = (this.dgMode === MODE.ADD) ? translate('add.device.group') :
          translate('edit.device.group');
        placeholder = translate('device.group.name') + '*';
        secondDetailsLines = this.renderDeviceGroup();
        groupName = 'dgName';
        value = this.state.deviceGroup.name || '';
      }

      const detailsClass = !this.state.showThirdDetails ? 'col-xs-6 details-section second-details'
        : 'col-xs-4 details-section verticalLine second-details';
      const buttonClass = this.state.showThirdDetails ? 'btn-container hide' : 'btn-container';

      return (
        <div className={detailsClass}>
          <div className='details-header'>{header}</div>
          <div className='details-body'>
            <ServerInput isRequired={true} placeholder={placeholder} autoFocus={true}
              inputValue={value} inputName={groupName} inputType='text'
              inputAction={this.handleInputLine} disabled={this.state.showThirdDetails}/>
            {secondDetailsLines}
            <div className='btn-row details-btn'>
              <div className={buttonClass}>
                <ActionButton key='cancel' type='default' clickAction={this.closeSecondDetails}
                  isDisabled={this.state.showThirdDetails} displayLabel={translate('cancel')}/>
                <ActionButton key='save' clickAction={this.saveSecondDetails}
                  isDisabled={!this.checkSecondDetailsDataToSave() || this.state.showThirdDetails}
                  displayLabel={translate('save')}/>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  removeVolumeGroup = (index) => {
    if (this.secondDetails === '' && !this.state.showThirdDetails) {
      this.setState(prevState => {
        let newVGs = prevState.volumeGroups.slice();
        newVGs.splice(index, 1);
        return {volumeGroups: newVGs};
      });
    }
  }

  removeDeviceGroup = (index) => {
    if (this.secondDetails === '' && !this.state.showThirdDetails) {
      this.setState(prevState => {
        let newDGs = prevState.deviceGroups.slice();
        newDGs.splice(index, 1);
        return {deviceGroups: newDGs};
      });
    }
  }

  saveDiskModel = () => {
    let diskModel = {
      name: this.state.diskModelName,
      'volume-groups': this.state.volumeGroups
    };
    if (this.state.deviceGroups.length > 0) {
      diskModel['device-groups'] = this.state.deviceGroups;
    }

    let model = this.props.model;
    if (this.dmMode === MODE.ADD) {
      model = model.updateIn(['inputModel', 'disk-models'],
        list => list.push(fromJS(diskModel)));
    } else {
      const index = getModelIndexByName(model, 'disk-models', this.origDKName);
      if (index !== -1) {
        model = model.updateIn(['inputModel', 'disk-models'],
          list => list.splice(index, 1, fromJS(diskModel)));
      }
    }
    this.props.updateGlobalState('model', model);
    this.props.closeAction();
  }

  checkDiskModelDataToSave = () => {
    if (this.dmMode === MODE.ADD) {
      return this.state.diskModelName && this.state.diskModelName !== '' &&
        this.state.volumeGroups.length > 0;
    } else {
      const vgs = this.state.volumeGroups.sort((a,b) => alphabetically(a.name, b.name));
      const dgs = this.state.deviceGroups.sort((a,b) => alphabetically(a.name, b.name));
      return this.state.diskModelName && this.state.diskModelName !== '' &&
        this.state.volumeGroups.length > 0 &&
        (this.state.diskModelName !== this.origDKName ||
         JSON.stringify(vgs) !== JSON.stringify(this.origVGs) ||
         JSON.stringify(dgs) !== JSON.stringify(this.origDGs));
    }
  }

  render() {
    const header = (this.dmMode === MODE.ADD) ? translate('add.disk.model') :
      translate('edit.disk.model');
    const detailsClass = (this.secondDetails === '') ? 'details-section second-details' :
      (this.state.showThirdDetails) ? 'col-xs-4 details-section second-details verticalLine' :
        'col-xs-6 details-section second-details verticalLine';
    const widthClass = (this.secondDetails === '') ? 'col-xs-4' :
      (this.state.showThirdDetails) ? 'col-xs-7 multiple-details' : 'col-xs-6 multiple-details';
    const addClass = this.secondDetails === '' ? 'material-icons add-button' :
      'material-icons add-button disabled';
    const removeClass = this.secondDetails === '' ? 'glyphicon glyphicon-trash right-sign' :
      'glyphicon glyphicon-trash right-sign disabled';
    const editClass = this.secondDetails === '' ? 'glyphicon glyphicon-pencil left-sign' :
      'glyphicon glyphicon-pencil left-sign disabled';

    let firstDetailsLines = [];
    // show volume groups
    firstDetailsLines.push(
      <div className='details-group-title' key='vg-title'>{translate('volume.groups') + '*:'}</div>
    );

    this.state.volumeGroups.map((vg, index) => {
      firstDetailsLines.push(
        <div className='dropdown-plus-minus' key={vg.name + index}>
          <ServerInput key={vg.name + index} inputType='text' inputValue={vg.name}
            disabled='true'/>
          <div className='plus-minus-container'>
            <span key={vg.name + 'edit' + index} className={editClass}
              onClick={() => this.editVolumeGroup(vg)}/>
            <span key={vg.name + 'minus' + index} className={removeClass}
              onClick={() => this.removeVolumeGroup(index)}/>
          </div>
        </div>
      );
    });
    firstDetailsLines.push(
      <div className='action-column' key='addVG'>
        <i className={addClass} onClick={this.addVolumeGroup}>add_circle</i>
        {translate('add.volume.group')}</div>
    );

    // show device groups
    firstDetailsLines.push(
      <div className='details-group-title' key='dg-title'>{translate('device.groups') + ':'}</div>
    );
    this.state.deviceGroups.map((dg, index) => {
      firstDetailsLines.push(
        <div className='dropdown-plus-minus' key={dg.name + index}>
          <ServerInput key={dg.name + index} inputType='text' inputValue={dg.name}
            disabled='true'/>
          <div className='plus-minus-container'>
            <span key={dg.name + 'edit' + index} className={editClass}
              onClick={() => this.editDeviceGroup(dg)}/>
            <span key={dg.name + 'minus' + index} className={removeClass}
              onClick={() => this.removeDeviceGroup(index)}/>
          </div>
        </div>
      );
    });
    firstDetailsLines.push(
      <div className='action-column' key='addDG'>
        <i className={addClass} onClick={this.addDeviceGroup}>add_circle</i>
        {translate('add.device.group')}</div>
    );

    const diskModels = this.props.model.getIn(['inputModel','disk-models'])
      .map((group) => {return group.get('name');}).sort().toJS();
    let extraProps = {names: diskModels, check_nospace: true};
    if (this.dmMode === MODE.EDIT) {
      if (diskModels.indexOf(this.origDKName) !== -1) {
        extraProps.names.splice(diskModels.indexOf(this.origDKName), 1);
      }
    }
    const buttonClass = (this.secondDetails === '') ? 'btn-container' : 'btn-container hide';

    return (
      <div className={widthClass}>
        <div className={detailsClass}>
          <div className='details-header'>{header}</div>
          <div className='details-body'>
            <ServerInput isRequired={true} placeholder={translate('disk.model.name') + '*'}
              inputValue={this.state.diskModelName} inputName='dmName' inputType='text'
              inputAction={this.handleInputLine} inputValidate={UniqueNameValidator} {...extraProps}
              autoFocus={true} disabled={this.secondDetails !== ''}/>
            {firstDetailsLines}
            <div className='btn-row details-btn'>
              <div className={buttonClass}>
                <ActionButton key='cancel' type='default' clickAction={this.props.closeAction}
                  isDisabled={this.secondDetails !== ''}
                  displayLabel={translate('cancel')}/>
                <ActionButton key='save' clickAction={this.saveDiskModel}
                  isDisabled={!this.checkDiskModelDataToSave() || this.secondDetails !== ''}
                  displayLabel={translate('save')}/>
              </div>
            </div>
          </div>
        </div>
        {this.renderSecondDetails()}
        {this.renderLogicalVolume()}
      </div>
    );
  }
}

export default DiskModelDetails;
