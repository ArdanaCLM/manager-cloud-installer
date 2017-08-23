import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import '../Deployer.css';
import { translate } from '../localization/localize.js';

class ContextMenuItems extends Component {
  constructor(props) {
    super(props);
    this.renderMenuItems = this.renderMenuItems.bind(this);
  }

  renderMenuItems() {
    let items = [];
    this.props.items.forEach((item) => {
      if(item.show) {
        let displayLabel = translate(item.key);
        items.push(
          <div className='menu-item'
            key={item.key} onClick={item.callback}>
            {displayLabel}
          </div>
        );
      }
    });
    return items;
  }

  render() {
    return (
      <div className='menu-item-list'>
        <div>
          {this.renderMenuItems()}
        </div>
      </div>
    );
  }
}

class ContextMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      show: this.props.show,
      location: this.props.location
    };

    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      show : newProps.show,
      location: newProps.location
    });
  }

  //dealing with mouth click outside
  handleClickOutside(e) {
    let show = this.state.show;
    let menuContainer = ReactDOM.findDOMNode(this.refs[this.props.refType]);
    //close the menu when click somewhere else
    if (!menuContainer.contains(e.target) &&
      e.target.getAttribute('name') !== 'itemMenuButton' && show) {
      this.setState({show: false});
    }
  }

  render() {
    let cName = 'context-menu-container ';
    cName = this.state.show ? cName : cName + 'hide';

    let locStyle = {
      left: this.state.location ? (this.state.location.x -100) : 0,
      top:  this.state.location ? this.state.location.y : 0
    };

    return (
      <div ref={this.props.refType} className={cName} style={locStyle}>
        <ContextMenuItems
          items={this.props.items}>
        </ContextMenuItems>
      </div>
    );
  }
}

export default ContextMenu;
