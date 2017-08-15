import React, { Component } from 'react';
import '../Deployer.css';
import { AssignButton, UnAssignButton } from '../components/Buttons.js';

class InnerTable extends Component {

  render() {
    var lines = (this.props.items.map((item) => {
      // highlight selected row
      if (this.props.selectedTable.length > 0 && this.props.selectedTable.indexOf(item.id) !== -1) {
        return (<tr onClick={this.props.clickAction} key={item.id} className='highlight'>
          <td>{item.id}</td></tr>);
      } else {
        return (<tr onClick={this.props.clickAction} key={item.id}>
          <td>{item.id}</td></tr>);
      }
    }));
    return (
      <div>
        <div className='header'>{this.props.header}</div>
        <div className='table-container'>
          <table><tbody>{lines}</tbody></table>
        </div>
      </div>
    );
  }
}

class TransferTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      leftTableItems: [],
      rightTableItems: [],
      selectedLeft: [],
      selectedRight: []
    };

    this.selectOnLeftTable = this.selectOnLeftTable.bind(this);
    this.selectOnRightTable = this.selectOnRightTable.bind(this);
    this.transferToLeft = this.transferToLeft.bind(this);
    this.transferToRight = this.transferToRight.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.inputList !== nextProps.inputList) {
      this.setState({leftTableItems: nextProps.inputList.slice()});
    }
  }

  selectOnLeftTable(event) {
    var current = this.state.selectedLeft.slice();
    var selectedItem = event.target.innerText;
    var currentIndex = current.indexOf(selectedItem);
    if (currentIndex == -1) {
      // if select for the first time, add item to the selected list to highlight it
      current.push(selectedItem);
    } else {
      // if select again, take it as 'deselection', remove item from the selected list
      current.splice(currentIndex, 1);
    }
    this.setState({selectedLeft: current});
  }

  selectOnRightTable(event) {
    var current = this.state.selectedRight.slice();
    var selectedItem = event.target.innerText;
    var currentIndex = current.indexOf(selectedItem);
    if (currentIndex == -1) {
      // if select for the first time, add item to the selected list to highlight it
      current.push(selectedItem);
    } else {
      // if select again, take it as 'deselection', remove item from the selected list
      current.splice(currentIndex, 1);
    }
    this.setState({selectedRight: current});
  }

  transferToLeft() {
    if (this.state.selectedRight.length > 0) {
      // add selected items to the left table
      var leftObjects = [];
      for (let i=0; i<this.state.selectedRight.length; i++) {
        for (let j=0; j<this.state.rightTableItems.length; j++) {
          if (this.state.rightTableItems[j].id == this.state.selectedRight[i]) {
            leftObjects.push(this.state.rightTableItems[j]);
          }
        }
      }
      var newLeftTableItems = this.state.leftTableItems.slice().concat(leftObjects);
      this.setState({leftTableItems: newLeftTableItems});

      // remove selected items from the right table
      var newRightTableItems = this.state.rightTableItems.slice();
      for (let k=0; k<this.state.selectedRight.length; k++) {
        newRightTableItems.splice(
          this.getObjectIndex(this.state.selectedRight[k], newRightTableItems), 1);
      }
      this.setState({rightTableItems: newRightTableItems, selectedRight: []});
    }
  }

  transferToRight() {
    if (this.state.selectedLeft.length > 0) {
      // add selected items to the right table
      var rightObjects = [];
      for (let i=0; i<this.state.selectedLeft.length; i++) {
        for (let j=0; j<this.state.leftTableItems.length; j++) {
          if (this.state.leftTableItems[j].id == this.state.selectedLeft[i]) {
            rightObjects.push(this.state.leftTableItems[j]);
          }
        }
      }
      var newRightTableItems = this.state.rightTableItems.slice().concat(rightObjects);
      this.setState({rightTableItems: newRightTableItems});

      // remove selected items from the left table
      var newLeftTableItems = this.state.leftTableItems.slice();
      for (let k=0; k<this.state.selectedLeft.length; k++) {
        newLeftTableItems.splice(
          this.getObjectIndex(this.state.selectedLeft[k], newLeftTableItems), 1);
      }
      this.setState({leftTableItems: newLeftTableItems, selectedLeft: []});
    }
  }

  // find index of object with the same id, return -1 if not found
  getObjectIndex(key, array) {
    for (let i=0; i<array.length; i++) {
      if (array[i].id == key) {return i;}
    }
    return -1;
  }

  render() {
    return (
      <div className='transfer-table col-xs-12'>
        <div className='col-xs-5 table-width'>
          <InnerTable items={this.state.leftTableItems}
            clickAction={this.selectOnLeftTable} header={this.props.leftTableHeader}
            selectedTable={this.state.selectedLeft}/>
        </div>

        <div className='col-xs-1 transfer-button-container'>
          <AssignButton clickAction={this.transferToRight}
            isDisabled={this.state.leftTableItems.length == 0}/>
          <UnAssignButton clickAction={this.transferToLeft}
            isDisabled={this.state.rightTableItems.length == 0}/>
        </div>

        <div className='col-xs-5 table-width'>
          <InnerTable items={this.state.rightTableItems}
            clickAction={this.selectOnRightTable} header={this.props.rightTableHeader}
            selectedTable={this.state.selectedRight}/>
        </div>
        <div className='col-sx-1'></div>
      </div>
    );
  }
}

export default TransferTable;
