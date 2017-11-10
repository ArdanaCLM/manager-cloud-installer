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
import { ServerInput, ServerDropdown } from '../components/ServerUtils.js';

class InlineAddRemoveDropdown extends Component {
  constructor(props) {
    super(props);
    if (props.values && props.values.length > 0) {
      this.state = {
        items: props.values,
        selectedItem: props.values[props.values.length - 1]
      };
    } else {
      this.state = {
        items: [''],
        selectedItem: ''
      };
    }
  }

  componentWillUpdate(nextProps, nextState) {
    // send selected items out to the parent
    if (this.state.items !== nextState.items) {
      // remove the default line when sending out
      let sentItems = nextState.items.slice();
      if (nextState.items.indexOf('') !== -1) {
        sentItems.splice(sentItems.indexOf(''), 1);
      }
      this.props.sendSelectedList(sentItems);

    } else if (this.state.selectedItem !== nextState.selectedItem) {
      nextState.items[nextState.items.length - 1] = nextState.selectedItem;
      nextState.selectedItem = '';

      // remove the default line when sending out
      let sentItems = nextState.items.slice();
      if (nextState.items.indexOf('') !== -1) {
        sentItems.splice(sentItems.indexOf(''), 1);
      }
      this.props.sendSelectedList(sentItems);
    }
  }

  handleSelectedItem = (item) => {
    this.setState({selectedItem: item});
  }

  /*
    State 'items' represent the number of items displayed in the group. At the beginning, there is
    default drop-down box which lists all options available to be selected. The state 'items' at
    this point is ['']. Once an option is selected, that option is added to 'items' before ''. The
    option shows as a text field above the drop-down box. The state 'items' at this point is
    ['optA', '']. If another option is selected, the option is added to 'items' before ''. At this
    point, 'items' looks like this: ['optA', 'optB', '']
  */
  addItem = () => {
    let selected = this.state.selectedItem;  // save value to prevent race condition

    // there's a selected item that is not added to the list
    if (this.state.selectedItem !== '') {
      // if the default line was deleted
      if (this.state.items.indexOf('') === -1) {
        this.setState(prevState => {
          // replace last item with the selected item and add default drop-down
          let newItems = prevState.items.slice();
          newItems[newItems.length - 1] = selected;
          newItems.push('');
          return {items: newItems};
        });
      } else {
        this.setState(prevState => {
          // add selected item before default drop-down
          let newItems = prevState.items.slice();
          newItems.splice(newItems.length - 1, 0, selected);
          return {items: newItems};
        });
      }
      this.setState({selectedItem: ''});
    } else {
      if (this.state.items.indexOf('') === -1) {
        this.setState(prevState => {
          // add default drop-down
          let newItems = prevState.items.slice();
          newItems.push('');
          return {items: newItems};
        });
      }
    }
  }

  removeItem = (index) => {
    this.setState((prevState) => {
      let newItems = prevState.items.slice();
      if (index === -1) {
        if (newItems.length > 1) {
          newItems.splice(newItems.length - 1, 1);
        } else {
          newItems[0] = '';
        }
      } else {
        newItems.splice(index, 1);
      }
      return {items: newItems};
    });
    this.setState({selectedItem: ''});
  }

  render() {
    let lines = [];
    let textFields = this.state.items.slice();
    if (this.state.items.length > 1) {
      // show all items except the last one in text mode
      textFields.splice(textFields.length - 1, 1);
      textFields.map((item, index) => {
        lines.push(
          <div className='dropdown-plus-minus' key={this.props.name + item + index}>
            <ServerInput key={this.props.name + item + index} inputType='text' inputValue={item}
              disabled='true'/>
            <div className='plus-minus-container'>
              <span key={this.props.name + item + 'minus' + index}
                className={'fa fa-minus left-sign'} onClick={() => this.removeItem(index)}/>
            </div>
          </div>
        );
      });
    }

    // create list for drop-down menu
    let options = this.props.options.slice();
    // remove already selected items, except the last one, from the list
    if (this.state.items.length > 1) {
      textFields.map((del) => {
        let i = options.indexOf(del);
        if (i != -1) {options.splice(i, 1);}
      });
    }
    // remove exception values (for self-nestable models, such as server-groups)
    if (this.props.exceptions) {
      this.props.exceptions.map((del) => {
        let i = options.indexOf(del);
        if (i != -1) {options.splice(i, 1);}
      });
    }

    options.unshift('');

    let lastItem = this.state.items[this.state.items.length - 1];
    const addClass = lastItem === '' ? 'fa fa-plus hide' : 'fa fa-plus right-sign';
    return (
      <div>
        {lines}
        <div className='dropdown-plus-minus'>
          <ServerDropdown key={this.props.name + 'start'} name={this.props.name} value={lastItem}
            optionList={options} defaultOption={this.props.defaultOption}
            selectAction={this.handleSelectedItem}/>
          <div className='plus-minus-container'>
            <span key={this.props.name + 'minus'} className={'fa fa-minus left-sign'}
              onClick={() => this.removeItem(-1)}/>
            <span key={this.props.name + 'plus'} className={addClass}
              onClick={this.addItem}/>
          </div>
        </div>
      </div>
    );
  }
}

class InlineAddRemoveInput extends Component {
  constructor(props) {
    super(props);
    if (props.values && props.values.length > 0) {
      this.state = {
        items: props.values,
        selectedItem: props.values[props.values.length - 1]
      };
    } else {
      this.state = {
        items: [''],
        selectedItem: ''
      };
    }
  }

  componentWillUpdate(nextProps, nextState) {
    // send selected items out to the parent as soon as value entered
    if (nextState.items === this.state.items) {
      if (nextState.selectedItem !== this.state.selectedItem) {
        let sentItems = nextState.items.slice();
        sentItems.splice(nextState.items.length - 1, 1, nextState.selectedItem);
        this.props.sendSelectedList(sentItems);
      }
    } else {
      let sentItems = nextState.items.slice();
      // remove the default line when sending out
      if (sentItems.indexOf('') !== -1) {
        sentItems.splice(sentItems.indexOf(''), 1);
      }
      this.props.sendSelectedList(sentItems);
    }
  }

  handleInputLine = (e, valid, props) => {
    let value = e.target.value;
    this.setState({selectedItem: value});
  }

  addItem = () => {
    if (!this.props.disabled) {
      this.setState(prevState => {
        if (prevState.selectedItem !== '') {
          let newItems = prevState.items.slice();
          newItems.splice(newItems.length - 1, 0, prevState.selectedItem);
          return {items: newItems, selectedItem: ''};
        }
      });
    }
  }

  removeItem = (index) => {
    if (!this.props.disabled) {
      if (index === -1) {
        this.setState(prevState => {
          let newItems = prevState.items.slice();
          if (newItems.length === 1) {
            newItems.splice(prevState.items.length - 1, 1, '');
            return {items: newItems, selectedItem: ''};
          } else {
            newItems.splice(prevState.items.length - 1, 1);
            return {items: newItems, selectedItem: newItems[newItems.length - 1]};
          }
        });
      } else {
        this.setState(prevState => {
          let newItems = prevState.items.slice();
          if (prevState.selectedItem !== '') {
            newItems.splice(prevState.items.length - 1, 1, this.state.selectedItem);
          }
          newItems.splice(index, 1);
          return {items: newItems, selectedItem: newItems[newItems.length - 1]};
        });
      }
    }
  }

  render() {
    const addClass = this.state.selectedItem === '' ? 'fa fa-plus hide' :
      this.props.disabled ? 'fa fa-plus right-sign disabled' : 'fa fa-plus right-sign';
    const removeClass = this.props.disabled ? 'fa fa-minus left-sign disabled' : 'fa fa-minus left-sign';
    let lines = [];
    let textFields = this.state.items.slice();
    textFields.splice(textFields.length - 1, 1);
    textFields.map((item, index) => {
      lines.push(
        <div className='dropdown-plus-minus' key={this.props.name + item + index}>
          <ServerInput key={this.props.name + item + index} inputType='text' inputValue={item}
            disabled='true'/>
          <div className='plus-minus-container'>
            <span key={this.props.name + item + 'minus' + index}
              className={removeClass} onClick={() => this.removeItem(index)}/>
          </div>
        </div>
      );
    });

    return (
      <div>
        {lines}
        <div className='dropdown-plus-minus'>
          <ServerInput key={this.props.name + 'start'} inputValue={this.state.selectedItem}
            inputType='text' inputAction={this.handleInputLine} placeholder={this.props.placeholder}
            disabled={this.props.disabled}/>
          <div className='plus-minus-container'>
            <span key={this.props.name + 'minus'} className={removeClass}
              onClick={() => this.removeItem(-1)}/>
            <span key={this.props.name + 'plus'} className={addClass}
              onClick={this.addItem}/>
          </div>
        </div>
      </div>
    );
  }
}

export { InlineAddRemoveDropdown, InlineAddRemoveInput };
