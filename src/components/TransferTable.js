import React, { Component } from 'react';
import '../Deployer.css';
import { AssignmentButton } from '../components/Buttons.js';

class InnerTable extends Component {
  render() {
    var lines = (this.props.items.map((item) => {
      // highlight selected row
      if (this.props.selectedTable.length > 0 && this.props.selectedTable.indexOf(item) !== -1) {
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
      leftTableItems: [],
      rightTableItems: [],
      selectedLeft: [],
      selectedRight: [],
      startingLeftIndex: -1,
      startingRightIndex: -1
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.inputList !== nextProps.inputList) {
      this.setState({leftTableItems: nextProps.inputList.sort()});
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.rightTableItems !== nextState.rightTableItems) {
      // send selected items out the parent
      this.props.sendSelectedList(nextState.rightTableItems);
    }
  }

  selectOnTable = (isLeftTable, event) => {
    var currentLocation = Math.ceil(event.target.offsetTop / event.target.offsetHeight);
    var newSelected = isLeftTable ? this.state.selectedLeft.slice() :
      this.state.selectedRight.slice();
    var currentTable = isLeftTable ? this.state.leftTableItems : this.state.rightTableItems;

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
      // add selected items to the left table
      var leftObjects = [];
      for (let i=0; i<this.state.selectedRight.length; i++) {
        for (let j=0; j<this.state.rightTableItems.length; j++) {
          if (this.state.rightTableItems[j] == this.state.selectedRight[i]) {
            leftObjects.push(this.state.rightTableItems[j]);
          }
        }
      }
      var newLeftTableItems = this.state.leftTableItems.concat(leftObjects);
      this.setState({leftTableItems: newLeftTableItems.sort()});

      // remove selected items from the right table
      var newRightTableItems = this.state.rightTableItems.slice();
      for (let k=0; k<this.state.selectedRight.length; k++) {
        newRightTableItems.splice(
          newRightTableItems.indexOf(this.state.selectedRight[k]), 1);
      }
      this.setState({rightTableItems: newRightTableItems.sort(), selectedRight: []});
    }
  }

  transferAllToLeft = () => {
    if (this.state.rightTableItems.length > 0) {
      this.setState((prevState) => {
        return {
          leftTableItems: prevState.leftTableItems.concat(prevState.rightTableItems).sort(),
          rightTableItems: [],
          selectedLeft: [],
          selectedRight: []
        };
      });
    }
  }

  transferToRight = () => {
    if (this.state.selectedLeft.length > 0) {
      // add selected items to the right table
      var rightObjects = [];
      for (let i=0; i<this.state.selectedLeft.length; i++) {
        for (let j=0; j<this.state.leftTableItems.length; j++) {
          if (this.state.leftTableItems[j] == this.state.selectedLeft[i]) {
            rightObjects.push(this.state.leftTableItems[j]);
          }
        }
      }
      var newRightTableItems = this.state.rightTableItems.concat(rightObjects);
      this.setState({rightTableItems: newRightTableItems.sort()});

      // remove selected items from the left table
      var newLeftTableItems = this.state.leftTableItems.slice();
      for (let k=0; k<this.state.selectedLeft.length; k++) {
        newLeftTableItems.splice(
          newLeftTableItems.indexOf(this.state.selectedLeft[k]), 1);
      }
      this.setState({leftTableItems: newLeftTableItems.sort(), selectedLeft: []});
    }
  }

  transferAllToRight = () => {
    if (this.state.leftTableItems.length > 0) {
      this.setState((prevState) => {
        return {
          leftTableItems: [],
          rightTableItems: prevState.leftTableItems.concat(prevState.rightTableItems).sort(),
          selectedLeft: [],
          selectedRight: []
        };
      });
    }
  }

  render() {
    return (
      <div className='transfer-table'>
        <div className='table-width'>
          <InnerTable items={this.state.leftTableItems}
            clickAction={(event) => this.selectOnTable(true, event)}
            header={this.props.leftTableHeader}
            selectedTable={this.state.selectedLeft}/>
        </div>

        <div className='transfer-button-container'>
          <div className='inner-button-container'>
            <AssignmentButton clickAction={this.transferAllToRight} type='double-right'
              isDisabled={this.state.leftTableItems.length == 0}/>
            <AssignmentButton clickAction={this.transferToRight} type='right'
              isDisabled={this.state.selectedLeft.length == 0}/>
            <AssignmentButton clickAction={this.transferToLeft} type='left'
              isDisabled={this.state.selectedRight.length == 0}/>
            <AssignmentButton clickAction={this.transferAllToLeft} type='double-left'
              isDisabled={this.state.rightTableItems.length == 0}/>
          </div>
        </div>

        <div className='table-width'>
          <InnerTable items={this.state.rightTableItems}
            clickAction={(event) => this.selectOnTable(false, event)}
            header={this.props.rightTableHeader}
            selectedTable={this.state.selectedRight}/>
        </div>
      </div>
    );
  }
}

export default TransferTable;
