import React, { Component }from 'react';
import ServerDragRowItemsTemplate from './ServerDragRowItemsTemplate.js';
import { DragLayer } from 'react-dnd';

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

const getFieldStyle = (isDragging) => {
  const style = {
    width: 300,
    maxWidth: 300,
  };
  style.opacity = isDragging ? 0.8 : 1;
  return style;
};

const getItemStyles = (props) => {
  const { currentOffset } = props;
  if (!currentOffset) {
    return {
      display: 'none',
    };
  }

  const { x, y } = currentOffset;

  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
};

const collect = (monitor) => ({
  item: monitor.getItem(),
  itemType: monitor.getItemType(),
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging(),
});

class ServerRowItemsDragLayer extends Component {
  renderDragItem(type, item) {
    switch (type) {
    case 'ROWITEM':
      return (
        <ServerDragRowItemsTemplate tableRows={item.tableRows}/>
      );
    default:
      return null;
    }
  }

  render() {
    const { item, itemType, isDragging } = this.props;

    if (!isDragging) {
      return null;
    }

    return (
      <div style={layerStyles}>
        <div style={getItemStyles(this.props)}>
          <div style={getFieldStyle(this.props.isDragging)}>
            {this.renderDragItem(itemType, item)}
          </div>
        </div>
      </div>
    );
  }
}

const dragLayer = DragLayer;
export default dragLayer(collect)(ServerRowItemsDragLayer);

