import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import { ServerInput, ServerDropdown } from '../components/ServerUtils.js';

class InlineAddRemoveDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [''],
      selectedItem: ''
    };
  }

  componentWillUpdate(nextProps, nextState) {
    // send selected items out to the parent
    if (this.state.items !== nextState.items) {
      console.log('sending out list, this.state.items: ' + this.state.items);
      console.log('sending out list, nextState.items: ' + nextState.items);

      // remove the default line when sending out
      let sentItems = nextState.items.slice();
      if (nextState.items.indexOf('') !== -1) {
        sentItems.splice(sentItems.indexOf(''), 1);
      }
      this.props.sendSelectedList(sentItems);

    } else if (this.state.selectedItem !== nextState.selectedItem) {
      console.log('sending out list, this.state.selectedItem: ' + this.state.selectedItem);
      console.log('sending out list, nextState.selectedItem: ' + nextState.selectedItem);
      nextState.items[nextState.items.length - 1] = nextState.selectedItem;
      nextState.selectedItem = '';
      console.log('nextState.items: ' + nextState.items);

      // remove the default line when sending out
      let sentItems = nextState.items.slice();
      if (nextState.items.indexOf('') !== -1) {
        sentItems.splice(sentItems.indexOf(''), 1);
      }
      this.props.sendSelectedList(sentItems);
    }
  }

  handleSelectedItem = (item) => {
    console.log('selectedItem: ' + item);
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
    console.log('addItem -> current items: ' + this.state.items);
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
          console.log('addItem -> items: ' + newItems);
          return {items: newItems};
        });
      } else {
        this.setState(prevState => {
          // add selected item before default drop-down
          let newItems = prevState.items.slice();
          newItems.splice(newItems.length - 1, 0, selected);
          console.log('addItem -> items: ' + newItems);
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
          console.log('addItem -> items: ' + newItems);
          return {items: newItems};
        });
      }
    }
  }

  removeItem = (index) => {
    console.log('removeItem' + index);
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
      console.log('items: ' + newItems);
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
        if (i != -1) {options.splice(i, 1)}
      });
    }
    options.unshift('');

    let lastItem = this.state.items[this.state.items.length - 1];
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
            <span key={this.props.name + 'plus'} className={'fa fa-plus right-sign'}
              onClick={this.addItem}/>
          </div>
        </div>
      </div>
    );
  }
}

export { InlineAddRemoveDropdown };
