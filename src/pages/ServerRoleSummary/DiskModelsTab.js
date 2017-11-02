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
import { ActionButton } from '../../components/Buttons.js';
import { alphabetically } from '../../utils/Sort.js';
import { List } from 'immutable';

class DiskModelsTab extends Component {

  constructor(props) {
    super(props);
  }

  addDiskModel = (e) => {
    console.log('addDiskModel'); // eslint-disable-line no-console
  }
  editDiskModel = (e) => {
    console.log('editDiskModel'); // eslint-disable-line no-console
  }

  render() {
    const rows = this.props.model.getIn(['inputModel','disk-models'])
      .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
      .map((m,idx) => {
        return (
          <tr key={idx}>
            <td>{m.get('name')}</td>
            <td>{m.get('volume-groups', new List()).size}</td>
            <td>{m.get('device_groups', new List()).size}</td>
            <td><span onClick={(e) => this.editDiskModel(e)} className='glyphicon glyphicon-pencil edit'></span></td>
          </tr>);
      });

    return (
      <div>
        <div className='button-box'>
          <div>
            <ActionButton displayLabel={translate('add.disk.model')} clickAction={(e) => this.addDiskModel(e)} />
          </div>
        </div>
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
          </tbody>
        </table>
      </div>
    );
  }
}

export default DiskModelsTab;
