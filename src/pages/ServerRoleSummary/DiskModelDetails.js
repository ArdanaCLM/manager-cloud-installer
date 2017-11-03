import React, { Component } from 'react';
import { fromJS } from 'immutable';
import { translate } from '../../localization/localize.js';
import { ServerInput } from '../../components/ServerUtils.js';
import { ActionButton } from '../../components/Buttons.js';
import { UniqueNameValidator } from '../../utils/InputValidators.js';
import { InlineAddRemoveInput } from '../../components/InlineAddRemoveFields.js';

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
        secondDetails: '',
        showThirdDetails: false
      };
    } else {
      // edit mode
      this.state = {
        name: props.diskModel.name,
        networks: props.diskModel.volumeGroups,
        serverGroups: props.diskModel.deviceGroups,
        secondDetails: ''
      };
      // for comparison purposes when checking for changes
      this.origName = this.props.diskModel.name;
      this.origVolumeGroups = this.props.diskModel.volumeGroups.slice().sort();
      this.origDeviceGroups = this.props.diskModel.deviceGroups.slice().sort();
    }
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
      if (value !== '') {
        this.setState(prevState => {
          let newLV = prevState.logicalVolume;
          newLV.fstype = value;
          return {logicalVolume: newLV};
        });
      }
    } else if (e.target.name === 'lvMount') {
      if (value !== '') {
        this.setState(prevState => {
          let newLV = prevState.logicalVolume;
          newLV.mount = value;
          return {logicalVolume: newLV};
        });
      }
    } else if (e.target.name === 'lvMkfs') {
      if (value !== '') {
        this.setState(prevState => {
          let newLV = prevState.logicalVolume;
          newLV['mkfs-opts'] = value;
          return {logicalVolume: newLV};
        });
      }
    } else if (e.target.name === 'dgConsumerName') {
      this.setState(prevState => {
        let newDGConsumer = prevState.deviceGroupConsumer;
        newDGConsumer.name = value;
        return {deviceGroupConsumer: newDGConsumer};
      });
    } else if (e.target.name === 'dgConsumerUsage') {
      if (value !== '') {
        this.setState(prevState => {
          let newDGConsumer = prevState.deviceGroupConsumer;
          newDGConsumer.usage = value;
          return {deviceGroupConsumer: newDGConsumer};
        });
      }
    } else if (e.target.name === 'dgConsumerAttrs') {
      if (value !== '') {
        this.setState(prevState => {
          let newDGConsumer = prevState.deviceGroupConsumer;
          newDGConsumer.attrs = value;
          return {deviceGroupConsumer: newDGConsumer};
        });
      }
    }
  }

  closeThirdDetails = () => {
    this.props.extendAction(2);
    this.setState({showThirdDetails: false});
  }

  addVolumeGroup = () => {
    if (this.state.secondDetails === '') {
      this.setState({secondDetails: 'vg'});
      this.props.extendAction(2);
    }
  }

  renderVolumeGroup = () => {
    let logicalVolumeLines = [];
    let textFields = this.state.logicalVolumes.slice();
    textFields.map((lv, index) => {
      logicalVolumeLines.push(
        <div className='dropdown-plus-minus' key={lv + index}>
          <ServerInput key={lv + index} inputType='text' inputValue={lv.name}
            disabled='true'/>
          <div className='plus-minus-container'>
            <span key={lv + 'minus' + index}
              className={'fa fa-minus left-sign'} onClick={() => this.removeLogicalVolume(index)}/>
          </div>
        </div>
      );
    });

    let addClass = 'material-icons add-button';
    addClass = this.state.showThirdDetails ? addClass + ' disabled' : addClass;
    return (
      <div>
        <InlineAddRemoveInput name='pv' placeholder={translate('physical.volume') + '*'}
          values={this.state.physicalVolumes} sendSelectedList={this.getSelectedPhysicalVolumes}
          disabled={this.state.showThirdDetails}/>
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
    this.setState({showThirdDetails: true});
    this.props.extendAction(3);
  }

  renderLogicalVolume = () => {
    if (this.state.showThirdDetails) {
      return (
        <div className='col-xs-4 details-section second-details'>
          <div className='details-header'>{translate('add.logical.volume')}</div>
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
    return (this.state.logicalVolume !== '') &&
      (this.state.logicalVolume.name !== undefined && this.state.logicalVolume.name !== '') &&
      (this.state.logicalVolume.size !== undefined && this.state.logicalVolume.size !== 0);
  }

  saveLogicalVolume = () => {
    this.closeThirdDetails();
    this.setState(prevState => {
      let newLVs = prevState.logicalVolumes.slice();
      let newLV = prevState.logicalVolume;
      newLV.size = prevState.logicalVolume.size + '%';
      newLVs.push(newLV);
      return {logicalVolumes: newLVs, logicalVolume: {}};
    });
  }

  removeLogicalVolume = (index) => {
    this.setState(prevState => {
      let newLVs = prevState.logicalVolumes.slice();
      newLVs.splice(index, 1);
      return {logicalVolumes: newLVs};
    });
  }

  addDeviceGroup = () => {
    if (this.state.secondDetails === '') {
      this.setState({secondDetails: 'dg'});
      this.props.extendAction(2);
    }
  }

  renderDeviceGroup = () => {
    return (
      <div>
        <InlineAddRemoveInput name='dgdevices' placeholder={translate('device.group.device') + '*'}
          values={this.state.deviceGroupDevices} sendSelectedList={this.getSelectedDGDevices}/>
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
    if (this.state.secondDetails === 'vg') {
      return (this.state.volumeGroup.name && this.state.volumeGroup.name !== '') &&
        (this.state.physicalVolumes.length > 0) && (this.state.logicalVolumes.length > 0);
    } else {
      return (this.state.deviceGroup.name && this.state.deviceGroup.name !== '') &&
        (this.state.deviceGroupConsumer.name && this.state.deviceGroupConsumer.name !== '') &&
        (this.state.deviceGroupDevices.length > 0) &&
        ((this.state.deviceGroupConsumer.usage && this.state.deviceGroupConsumer.usage !== '') ||
         (this.state.deviceGroupConsumer.attrs && this.state.deviceGroupConsumer.attrs !== ''));
    }
  }

  saveSecondDetails = () => {
    if (this.state.secondDetails === 'vg') {
      this.setState(prevState => {
        let newVG = prevState.volumeGroup;
        newVG['physical-volumes'] = prevState.physicalVolumes.slice();
        newVG['logical-volumes'] = prevState.logicalVolumes.slice();
        let newVGs = prevState.volumeGroups;
        newVGs.push(newVG);
        return {
          volumeGroups: newVGs,
          volumeGroup: {},
          physicalVolumes: [],
          logicalVolumes: []
        };
      });
    } else {
      this.setState(prevState => {
        let newDG = prevState.deviceGroup;
        newDG.consumer = prevState.deviceGroupConsumer;
        newDG.devices = prevState.deviceGroupDevices.map((device) => {return {name: device};});
        let newDGs = prevState.deviceGroups;
        newDGs.push(newDG);
        return {
          deviceGroups: newDGs,
          deviceGroup: {},
          deviceGroupDevices: [],
          deviceGroupConsumer: {}
        };
      });
    }
    this.closeSecondDetails();
  }

  closeSecondDetails = () => {
    this.props.extendAction(1);
    this.setState({secondDetails: ''});
  }

  renderSecondDetails = () => {
    if (this.state.secondDetails !== '') {
      let header = translate('add.volume.group');
      let placeholder = translate('volume.group.name') + '*';
      let secondDetailsLines = this.renderVolumeGroup();
      let groupName = this.state.secondDetails + 'Name';
      let value = this.state.volumeGroup.name || '';
      if (this.state.secondDetails === 'dg') {
        header = translate('add.device.group');
        placeholder = translate('device.group.name') + '*';
        secondDetailsLines = this.renderDeviceGroup();
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
    if (this.state.secondDetails !== '') {
      this.setState(prevState => {
        let newVGs = prevState.volumeGroups.slice();
        newVGs.splice(index, 1);
        return {volumeGroups: newVGs};
      });
    }
  }

  removeDeviceGroup = (index) => {
    if (this.state.secondDetails !== '') {
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
    if (this.props.diskModel === '') {
      // add mode
      model = model.updateIn(['inputModel', 'disk-models'],
        list => list.push(fromJS(diskModel)));
    }
    this.props.updateGlobalState('model', model);
    this.props.closeAction();
  }

  checkDiskModelDataToSave = () => {
    if (this.props.diskModel === '') {
      return (this.state.diskModelName && this.state.diskModelName !== '') &&
        (this.state.volumeGroups.length > 0);
    }
  }

  render() {
    const header = (this.props.diskModel === '') ? translate('add.disk.model') :
      translate('edit.disk.model');
    const detailsClass = (this.state.secondDetails === '') ? 'details-section second-details' :
      (this.state.showThirdDetails) ? 'col-xs-4 details-section second-details verticalLine' :
        'col-xs-6 details-section second-details verticalLine';
    const widthClass = (this.state.secondDetails === '') ? 'col-xs-4' :
      (this.state.showThirdDetails) ? 'col-xs-7 multiple-details' : 'col-xs-6 multiple-details';
    const addClass = this.state.secondDetails === '' ? 'material-icons add-button' :
      'material-icons add-button disabled';
    const removeClass = this.state.secondDetails === '' ? 'fa fa-minus left-sign' :
      'fa fa-minus left-sign disabled';

    let firstDetailsLines = [];
    if (this.props.diskModel === '') {
      // show volume groups
      this.state.volumeGroups.map((vg, index) => {
        firstDetailsLines.push(
          <div className='dropdown-plus-minus' key={vg.name + index}>
            <ServerInput key={vg.name + index} inputType='text' inputValue={vg.name}
              disabled='true'/>
            <div className='plus-minus-container'>
              <span key={vg.name + 'minus' + index}
                className={removeClass} onClick={() => this.removeVolumeGroup(index)}/>
            </div>
          </div>
        );
      });
      firstDetailsLines.push(
        <div className='action-column' key='addVG'>
          <i className={addClass} onClick={this.addVolumeGroup}>add_circle</i>
          {translate('add.volume.group') + '*'}</div>
      );

      // show device groups
      this.state.deviceGroups.map((dv, index) => {
        firstDetailsLines.push(
          <div className='dropdown-plus-minus' key={dv.name + index}>
            <ServerInput key={dv.name + index} inputType='text' inputValue={dv.name}
              disabled='true'/>
            <div className='plus-minus-container'>
              <span key={dv.name + 'minus' + index}
                className={removeClass} onClick={() => this.removeDeviceGroup(index)}/>
            </div>
          </div>
        );
      });
      firstDetailsLines.push(
        <div className='action-column' key='addDG'>
          <i className={addClass} onClick={this.addDeviceGroup}>add_circle</i>
          {translate('add.device.group')}</div>
      );
    }

    const diskModels = this.props.model.getIn(['inputModel','disk-models'])
      .map((group) => {return group.get('name');}).sort().toJS();
    let extraProps = {names: diskModels, check_nospace: true};
    if (this.props.diskModel !== '') {
      if (diskModels.indexOf(this.origName) !== -1) {
        extraProps.names.splice(diskModels.indexOf(this.origName), 1);
      }
    }
    const buttonClass = (this.state.secondDetails === '') ? 'btn-container' : 'btn-container hide';

    return (
      <div className={widthClass}>
        <div className={detailsClass}>
          <div className='details-header'>{header}</div>
          <div className='details-body'>
            <ServerInput isRequired={true} placeholder={translate('disk.model.name') + '*'}
              inputValue={this.state.diskModelName} inputName='dmName' inputType='text' {...extraProps}
              inputAction={this.handleInputLine} inputValidate={UniqueNameValidator}
              autoFocus={true} disabled={this.state.secondDetails !== ''}/>
            {firstDetailsLines}
            <div className='btn-row details-btn'>
              <div className={buttonClass}>
                <ActionButton key='cancel' type='default' clickAction={this.props.closeAction}
                  isDisabled={this.state.secondDetails !== ''}
                  displayLabel={translate('cancel')}/>
                <ActionButton key='save' clickAction={this.saveDiskModel}
                  isDisabled={!this.checkDiskModelDataToSave() || this.state.secondDetails !== ''}
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
