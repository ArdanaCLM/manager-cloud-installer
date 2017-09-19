import React, { Component } from 'react';
import { EditPencilForTableRow } from '../components/Buttons.js';

class ServerRowItem extends Component {
  constructor(props) {
    super(props);
  }

  /**
   * drag and drop support for server assignment, assigns the current set of data properties
   * to the dataTransfer (payload) of the drag event so it can be picked up by the drop handler
   *
   * @param {event} ev the browser onDragStart event object
   * @param {Object} dataDef the server data definition (keys primarily)
   * @param {Object} data the server data payload
   */
  drag(ev, dataDef, data) {
    dataDef.map(function (key, value) {
      ev.dataTransfer.setData(key.name, data[key.name]);
    });
    //setData only supports strings, JSON stringify here, parse on the other end
    ev.dataTransfer.setData("dataDef", JSON.stringify(dataDef));
    ev.dataTransfer.setData("data", JSON.stringify(data));
  }

  handleCustomAction = (data) => {
    if(this.props.customAction) {
      this.props.customAction(data);
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
    if(this.props.tableId === 'right') {
      return (
        <tr className='table-row'
          draggable="true" onDragStart={(event) => this.drag(event, this.props.dataDef, this.props.data)}>
          {this.renderServerColumns()}
          <EditPencilForTableRow
            clickAction={(e) => this.handleCustomAction(this.props.data)}>
          </EditPencilForTableRow>
        </tr>
      );
    }
    else {
      return (
        <tr className='table-row'
          draggable="true" onDragStart={(event) => this.drag(event, this.props.dataDef, this.props.data)}>
          {this.renderServerColumns()}
        </tr>
      );
    }
  }
}

export default ServerRowItem;
