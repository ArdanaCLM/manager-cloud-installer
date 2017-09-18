import React, { Component } from 'react';
import { EditPencilForTableRow } from '../components/Buttons.js';

class ServerRowItem extends Component {
  constructor(props) {
    super(props);
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
        <tr>
          {this.renderServerColumns()}
          <EditPencilForTableRow
            clickAction={(e) => this.handleCustomAction(this.props.data)}>
          </EditPencilForTableRow>
        </tr>
      );
    }
    else {
      return (
        <tr>
          {this.renderServerColumns()}
        </tr>
      );
    }
  }
}

export default ServerRowItem;
