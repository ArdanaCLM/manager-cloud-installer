import React, { Component } from 'react';
import '../Deployer.css';
import { AssignmentButton } from '../components/Buttons.js';

class InnerTable extends Component {
  render() {
    var lines = (this.props.items.map((item) => {
      // highlight selected row
      if (this.props.selectedItems.length > 0 && this.props.selectedItems.indexOf(item) !== -1) {
        return (<tr onClick={this.props.clickAction} key={item} className='highlight'>
          <td>{item}</td></tr>);
      } else {
        return (<tr onClick={this.props.clickAction} key={item}>
          <td>{item}</td></tr>);
      }
    }));
    return (
      <div>
        <h5>{this.props.header}</h5>
        <div className='table-container rounded-corner'>
          <table><tbody>{lines}</tbody></table>
        </div>
      </div>
    );
  }
}

class TransferTable extends Component {
  constructor() {
    super();
    this.state = {
      selectedLeft: [],
      selectedRight: [],
      startingLeftIndex: -1,
      startingRightIndex: -1
    };
  }

  selectOnTable = (isLeftTable, event) => {
    var currentLocation = Math.ceil(event.target.offsetTop / event.target.offsetHeight);
    var newSelected = isLeftTable ? this.state.selectedLeft.slice() :
      this.state.selectedRight.slice();
    var currentTable = isLeftTable ? this.props.leftList : this.props.rightList;

    // use shift + click to select multiple rows
    if (event.shiftKey) {
      var startIndex = isLeftTable ? this.state.startingLeftIndex : this.state.startingRightIndex;
      var range = [startIndex, currentLocation];
      range.sort();
      for (let i=range[0]; i<=range[1]; i++) {
        let selectedItem = currentTable[i];
        let newSelectIndex = newSelected.indexOf(selectedItem);
        if (newSelectIndex == -1) {
          newSelected.push(selectedItem);
        }
      }

    } else {
      if (isLeftTable) {
        this.setState({startingLeftIndex: currentLocation});
      } else {
        this.setState({startingRightIndex: currentLocation});
      }
      let selectedItem = currentTable[currentLocation];
      let newSelectIndex = newSelected.indexOf(selectedItem);
      if (newSelectIndex == -1) {
        // if select for the first time, add item to the selected list to highlight it
        newSelected.push(selectedItem);
      } else {
        // if select again, take it as 'deselection', remove item from the selected list
        newSelected.splice(newSelectIndex, 1);
      }
    }

    if (isLeftTable) {
      this.setState({selectedLeft: newSelected});
    } else {
      this.setState({selectedRight: newSelected});
    }
  }

  transferToLeft = () => {
    if (this.state.selectedRight.length > 0) {
      // add selected items to the left table and remove them from the right table
      const newLeftList = this.props.leftList.concat(this.state.selectedRight).sort();
      const newRightList = this.props.rightList.filter(e => ! this.state.selectedRight.includes(e));

      this.setState({selectedRight: []});
      this.props.updateLeftList(newLeftList);
      this.props.updateRightList(newRightList);
    }
  }

  transferAllToLeft = () => {
    if (this.props.rightList.length > 0) {

      const newLeftList = this.props.leftList.concat(this.props.rightList).sort();

      this.setState({selectedRight: []});
      this.props.updateLeftList(newLeftList);
      this.props.updateRightList([]);
    }
  }

  transferToRight = () => {
    if (this.state.selectedLeft.length > 0) {
      // add selected items to the right table and remove them from the left table
      const newRightList = this.props.rightList.concat(this.state.selectedLeft).sort();
      const newLeftList = this.props.leftList.filter(e => ! this.state.selectedLeft.includes(e));

      this.setState({selectedLeft: []});
      this.props.updateLeftList(newLeftList);
      this.props.updateRightList(newRightList);

    }
  }

  transferAllToRight = () => {
    if (this.props.leftList.length > 0) {
      const newRightList = this.props.rightList.concat(this.props.leftList).sort();

      this.setState({selectedLeft: []});
      this.props.updateLeftList([]);
      this.props.updateRightList(newRightList);
    }
  }

  render() {
    return (
      <div className='transfer-table'>
        <div className='table-width'>
          <InnerTable items={this.props.leftList}
            clickAction={(event) => this.selectOnTable(true, event)}
            header={this.props.leftTableHeader}
            selectedItems={this.state.selectedLeft}/>
        </div>

        <div className='transfer-button-container'>
          <div className='inner-button-container'>
            <AssignmentButton clickAction={this.transferAllToRight} type='double-right'
              isDisabled={this.props.leftList.length == 0}/>
            <AssignmentButton clickAction={this.transferToRight} type='right'
              isDisabled={this.state.selectedLeft.length == 0}/>
            <AssignmentButton clickAction={this.transferToLeft} type='left'
              isDisabled={this.state.selectedRight.length == 0}/>
            <AssignmentButton clickAction={this.transferAllToLeft} type='double-left'
              isDisabled={this.props.rightList.length == 0}/>
          </div>
        </div>

        <div className='table-width'>
          <InnerTable items={this.props.rightList}
            clickAction={(event) => this.selectOnTable(false, event)}
            header={this.props.rightTableHeader}
            selectedItems={this.state.selectedRight}/>
        </div>
      </div>
    );
  }
}

export default TransferTable;
