import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';

class BackButton extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let buttonClass = 'btn btn-primary btn-has-next';

    return (
      <button className={buttonClass} onClick={this.props.clickAction}>
        {translate('back')}
      </button>
    );
  }
}

class NextButton extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let buttonClass = 'btn btn-primary';
    buttonClass =
      this.props.isDisabled ? buttonClass + ' ' + 'disabled' : buttonClass;

    let buttonLabel = translate('next');
    if (this.props.displayLabel) {
      buttonLabel = this.props.displayLabel;
    }

    return (
      <button className={buttonClass} onClick={this.props.clickAction}
        disabled={this.props.isDisabled}>{buttonLabel}
      </button>
    );
  }
}

class ActionButton extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let buttonClass = (this.props.hasNext) ? 'btn btn-primary btn-has-next' : 'btn btn-primary';
    buttonClass =
      this.props.isDisabled ? buttonClass + ' ' + 'disabled' : buttonClass;
    buttonClass =
      this.props.className ? buttonClass + ' ' + this.props.className : buttonClass;

    return (
      <button className={buttonClass} onClick={this.props.clickAction}
        disabled={this.props.isDisabled}>{this.props.displayLabel}
      </button>
    );
  }
}

class PickerButton extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let classN = 'picker-card rounded-corner shadowed-border' +
      (this.props.isSelected ? ' selected' : '');
    return (
      <div className={classN} name={this.props.keyName}
        onClick={this.props.clickAction}>{this.props.displayLabel}</div>
    );
  }
}

class ActivePickerButton extends Component {
  constructor() {
    super();

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();
    this.props.handleClick(e);
  }

  render() {
    let buttonClass = 'model-elements' + (this.props.isSelected ? ' model-element-selected' : '');
    return (
      <div className={buttonClass}>
        <div
          id={this.props.id}
          className='card rounded-corner shadowed-border'
          onClick={this.handleClick}
          value={this.props.value} >
          <p className='glyphicon glyphicon-pencil edit-icon pull-right'></p>
          <p className='card-text-unit' id={this.props.id}>
            {this.props.value}
          </p>
          <h4 id={this.props.id}>
            {this.props.description}
          </h4>
        </div>
      </div>
    );
  }
}

class ItemHelpButton extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let helpAction = this.props.clickAction;
    return (
      <span
        className='glyphicon glyphicon-info-sign helper'
        onClick={helpAction}>
      </span>
    );
  }
}

class AssignButton extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let assignAction = this.props.clickAction;
    let isDisabled = this.props.isDisabled === true;
    let cName = 'glyphicon glyphicon-arrow-right assign';
    cName = isDisabled ? cName + ' disabled' : cName;
    return (
      <span
        className={cName} onClick={assignAction}>
      </span>
    );
  }
}


class UnAssignButton extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let unAssignAction = this.props.clickAction;
    let isDisabled = this.props.isDisabled === true;
    let cName = 'glyphicon glyphicon-arrow-left unassign';
    cName = isDisabled ? cName + ' disabled' : cName;
    return (
      <span
        className={cName} onClick={unAssignAction}>
      </span>
    );
  }
}

class ItemMenuButton extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let showMenuAction = this.props.clickAction;
    let moreClass = this.props.className || '';
    let cName = 'glyphicon glyphicon-option-vertical ' + moreClass;
    return (
      <span
        name='itemMenuButton'
        className={cName} onClick={showMenuAction}>
      </span>
    );
  }
}

module.exports = {
  BackButton: BackButton,
  NextButton: NextButton,
  PickerButton: PickerButton,
  ActivePickerButton: ActivePickerButton,
  ActionButton: ActionButton,
  ItemHelpButton: ItemHelpButton,
  AssignButton: AssignButton,
  UnAssignButton: UnAssignButton,
  ItemMenuButton: ItemMenuButton
};
