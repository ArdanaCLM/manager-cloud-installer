import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

const dragSource = DragSource;

const getRowStyle = (isDragging, selected) => {
  const style = { height: 30};
  style.backgroundColor = selected ? '#00C081' : 'white';
  style.opacity = isDragging ? 0.5 : 1;
  return style;
};

const rowSource = {
  beginDrag(props) {
    let dragRows;
    if (props.selectedRows.find(row => row.id === props.data.id)) {
      dragRows = props.selectedRows;
    } else {
      dragRows = [...props.selectedRows, props.name];
    }
    return {tableRows: dragRows, source: props.selectedSource};
  },
  endDrag(props, monitor) {
    // When dropped on a compatible target, do something
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();
    //if (dropResult) {
      props.moveAction(item.tableRows, item.source);
      props.clearItemSelection();
    //}
  },
};

const collect = (connect, monitor) => ({
  // Call this function inside render()
  // to let React DnD handle the drag events:
  connectDragSource: connect.dragSource(),
  // You can ask the monitor about the current drag preview
  connectDragPreview: connect.dragPreview(),
  // You can ask the monitor about the current drag state:
  isDragging: monitor.isDragging(),
});

class ServerRowItem extends Component {
  constructor(props) {
    super(props);
    this.state = {selected: false};
  }

  componentDidMount() {
    this.props.connectDragPreview(getEmptyImage(), {
     captureDraggingState: true,
    });
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

  handleRowSelection = (index) => {
    let isSel = !this.state.selected;
    this.setState({selected: isSel}); //toggle
    this.props.selectAction(index, isSel)
  }

  handleDoubleClick = (data) => {
    this.props.doubleClickAction(data);
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
    return this.props.connectDragSource (
      <tr
        style={getRowStyle(false, this.state.selected)}
        onDoubleClick={(e) => this.handleDoubleClick(this.props.data)}
        onClick={(e) => this.handleRowSelection(this.props.index)}>
        {this.renderServerColumns()}
      </tr>
    );
  }
}

export default dragSource('ROWITEM', rowSource, collect)(ServerRowItem);
