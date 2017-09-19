import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import ServerRowItem from './ServerRowItem.js';

class ServerTable extends Component {
  constructor(props) {
    super(props);
  }

  renderServerRows() {
    let items =
      this.props.tableData.map((row, index) => {
        return (
          <ServerRowItem
            data={row}
            dataDef={this.props.tableConfig.columns}
            customAction={this.props.customAction}
            tableId={this.props.id}
            key={index}>
          </ServerRowItem>
        );
      });
    return items;
  }

  renderTableHeaders() {
    let keyCount = 0;
    let headers =
      this.props.tableConfig.columns.map((colDef, index) => {
        if(!colDef.hidden) {
          return (
            <th key={keyCount++}>{translate('server.item.' + colDef.name)}</th>
          );
        }
      });

    return (
      <tr className='table-header rounded-corner'>{headers}</tr>
    );
  }

  render() {
    return (
      <table className='full-width'><tbody>
        {!this.props.noHeader && this.renderTableHeaders()}
        {this.renderServerRows()}</tbody>
      </table>
    );
  }
}

export default ServerTable;
