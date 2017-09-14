import React, { Component } from 'react';

class ServerRowItem extends Component {
  constructor(props) {
    super(props);
  }

  isHidden(key) {
    let isHidden = false;
    let def = this.props.dataDef.find((def, idx) => {
      return def.name === key && def.hidden === true;
    });
    if(def) {
      isHidden = true;
    }
    return isHidden;
  }

  renderServerColumns() {
    let cols = [];
    let keyCount = 0;
    this.props.dataDef.forEach((def) => {
      if(!def.hidden) {
        let badgeClass = '';
        if(def.name === 'name') {
          if(this.props.data.source === 'suma') {
            badgeClass = 'suma-badge';
          }
          else if(this.props.data.source === 'oneview') {
            badgeClass = 'oneview-badge';
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
    return (
      <tr>
        {this.renderServerColumns()}
      </tr>
    );
  }
}

export default ServerRowItem;
