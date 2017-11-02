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
import { EditPencilForTableRow , InfoForTableRow} from './Buttons.js';

class ServerRowItem extends Component {
  constructor(props) {
    super(props);
  }

  /**
   * drag and drop support for server assignment, assigns the current set of data properties
   * to the dataTransfer (payload) of the drag event so it can be picked up by the drop handler
   *
   * @param {event} ev the browser onDragStart event object
   * @param {Object} data the server data payload
   */
  drag(ev, data) {
    //setData only supports strings, JSON stringify here, parse on the other end
    ev.dataTransfer.setData('data', JSON.stringify(data));
  }

  handleEditAction = (data) => {
    if(this.props.editAction) {
      this.props.editAction(data);
    }
  }

  handleViewAction = (data, tableId) => {
    if(this.props.viewAction) {
      this.props.viewAction(data, tableId);
    }
  }

  renderServerColumns() {
    let cols = [];
    let keyCount = 0;
    this.props.dataDef.forEach((def) => {
      if(!def.hidden) {
        let badgeClass = '';
        if(def.name === 'name') {
          if(this.props.data.source === 'sm') {
            badgeClass = 'sm-badge';
          }
          else if(this.props.data.source === 'ov') {
            badgeClass = 'ov-badge';
          }
        }
        let col = (
          <td className={badgeClass} key={keyCount++}>{this.props.data[def.name]}</td>
        );
        cols.push(col);
      }
    });

    return cols;
  }

  render() {
    let cName = 'draggable';
    if(this.props.tableId === 'rightTableId') {
      let requiredUpdate = false;
      let badInput = undefined;
      if(this.props.checkInputs) {
        badInput = this.props.checkInputs.find((key) => {
          return (this.props.data[key] === undefined || this.props.data[key] === '');
        });
      }
      if(badInput) {
        requiredUpdate = true;
      }
      cName = requiredUpdate ? cName + ' required-update' : cName;
      return (
        <tr className={cName}
          draggable="true" onDragStart={(event) => this.drag(event, this.props.data)}>
          {this.renderServerColumns()}
          <InfoForTableRow
            clickAction={(e) => this.handleViewAction(this.props.data, this.props.tableId)}>
          </InfoForTableRow>
          <EditPencilForTableRow
            clickAction={(e) => this.handleEditAction(this.props.data)}>
          </EditPencilForTableRow>
        </tr>
      );
    }
    else {
      return (
        <tr className={cName}
          draggable="true" onDragStart={(event) => this.drag(event, this.props.data)}>
          {this.renderServerColumns()}
          <InfoForTableRow
            clickAction={(e) => this.handleViewAction(this.props.data, this.props.tableId)}>
          </InfoForTableRow>
        </tr>
      );
    }
  }
}

export default ServerRowItem;
