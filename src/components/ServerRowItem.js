// (c) Copyright 2017 SUSE LLC
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

  renderInfoRow() {
    return (
      <InfoForTableRow
        clickAction={(e) => this.handleViewAction(this.props.data, this.props.tableId)}/>
    );
  }

  renderEditRow() {
    return (
      <EditPencilForTableRow
        clickAction={(e) => this.handleEditAction(this.props.data)}/>
    );
  }

  render() {
    let cName = 'draggable';
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
        {this.props.viewAction && this.renderInfoRow()}
        {this.props.editAction && this.renderEditRow()}
      </tr>
    );
  }
}

export default ServerRowItem;
