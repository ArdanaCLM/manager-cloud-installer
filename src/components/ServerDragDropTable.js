import React, { Component } from 'react';
import { Table } from 'react-bootstrap';
import { DropTarget } from 'react-dnd';
import { translate } from '../localization/localize.js';
import ServerRowItem from './ServerRowItem.js';

const nodeTarget = {
  drop(props) {
    return props.data;
  },
  canDrop(props, monitor) {
    return monitor.getItem().source !== props.id;
  },
};

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
  };
}

class ServerDragDropTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRows: [],
      lastSelectedIndex: -1
    };
  }

  componentWillMount() {
    this.handleRowSelection(-1, false);
  }

  handleRowSelection = (index, isSelected) => {
    let selRows = this.state.selectedRows.slice();
    let rows = this.props.tableData;
    let row = index < 0 ? undefined : rows[index];
    let lastSelectedIndex = index;

    if(isSelected) {
      selRows.push(row);
    }
    else { //de-select
      let idx =
       selRows.findIndex((aRow) => {
         return row.id === aRow.id;
       });

      if(idx !== -1) {
        selRows.splice(idx, 1);
      }
    }
    let finalSelected = rows ? rows.filter((r) => selRows.find((sr) => sr.id === r.id)) : [];
    this.setState({selectedRows: finalSelected, lastSelectedIndex: lastSelectedIndex});
  }

  handleClearRowsSelection = () => {
    this.setState({selectedRows: [], lastSelectedIndex: -1});
  }

  handleDoubleClickTableRow = (rowData) => {
    this.props.doubleClickAction(rowData);
  }

  renderServerRows() {
    let items =
      this.props.tableData.map((row, index) => {
        return (
          <ServerRowItem
            data={row}
            dataDef={this.props.tableConfig.columns}
            key={index}
            selectedSource={this.props.id}
            moveAction={this.props.moveAction}
            clearItemSelection={this.handleClearRowsSelection}
            selectedRows={this.state.selectedRows}
            selectAction={this.handleRowSelection}
            doubleClickAction={this.handleDoubleClickTableRow}
            index={index}>
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
      <thead>
        <tr>{headers}</tr>
      </thead>
    );
  }

  render() {
    return (
      <div>
        <Table striped bordered hover condensed responsive>
        {!this.props.noHeader && this.renderTableHeaders()}
        <tbody>
          {this.renderServerRows()}
        </tbody>
        </Table>
      </div>
    );
  }
}

const dropTarget = DropTarget;
export default dropTarget('ROWITEM', nodeTarget, collect)(ServerDragDropTable);
