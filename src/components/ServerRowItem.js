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
   * @param {Object} data the server data payload
   */
  drag(ev, data) {
    //setData only supports strings, JSON stringify here, parse on the other end
    ev.dataTransfer.setData('data', JSON.stringify(data));
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
    let cName = 'draggable';
    if(this.props.tableId === 'right') {
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
          <EditPencilForTableRow
            clickAction={(e) => this.handleCustomAction(this.props.data)}>
          </EditPencilForTableRow>
        </tr>
      );
    }
    else {
      return (
        <tr className={cName}
          draggable="true" onDragStart={(event) => this.drag(event, this.props.data)}>
          {this.renderServerColumns()}
        </tr>
      );
    }
  }
}

export default ServerRowItem;
