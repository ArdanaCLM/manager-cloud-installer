// (c) Copyright 2017 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
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
    let cName = 'context-menu-container rounded-corner shadowed-border';
    cName = this.state.show ? cName : cName + ' hide';

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
