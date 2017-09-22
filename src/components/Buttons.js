import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';

function BackButton(props) {
  return (
    <ActionButton
      clickAction={props.clickAction}
      displayLabel={props.displayLabel || translate('back')}
      isDisabled={props.isDisabled}
    />
  );
}

function NextButton(props) {
  return (
    <ActionButton
      clickAction={props.clickAction}
      displayLabel={props.displayLabel || translate('next')}
      isDisabled={props.isDisabled}
    />
  );
}

class ActionButton extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let buttonClass = 'btn btn-primary' +
      (this.props.isDisabled ? ' disabled' : '') +
      (this.props.className ? ' ' + this.props.className : '');

    return (
      <button
        className={buttonClass}
        onClick={this.props.clickAction}
        disabled={this.props.isDisabled}>{this.props.displayLabel}
      </button>
    );
  }
}


class LoadFileButton extends Component {

  constructor(props) {
    super(props);
  }

  // Trigger a click on the hidden button when the visible one is clicked.
  // The real button (<input type="file">) is actually a single DOM element
  // that shows both a button and a text field.  We want the text field, and
  // the input is harder to style, so we will just use one of our own styled
  // buttons and forward the events to the hidden control.
  onClickShownButton = (e) => {
    this.hiddenButton.click();
  }

  onFileSelected = (e) => {
    const file = e.target.files[0];

    // Reset the form, which clears out the filename from the hidden input.
    // Without this, if you were to press the button again and re-load the
    // same file, it would not trigger the input's onChange event, preventing
    // the file from being reloaded
    this.form.reset();

    if (file) {
      this.props.clickAction(file);
    }
  }

  render() {
    const hidden = { display: 'none' };
    return (
      <span>
        <ActionButton
          clickAction={this.onClickShownButton}
          displayLabel={this.props.displayLabel}
          isDisabled={this.props.isDisabled || false}
          />
        <form ref={(form) => { this.form = form; }} >
          <input type="file"
            onChange={this.onFileSelected}
            accept={this.props.extensions || ".csv"}
            ref={(input) => { this.hiddenButton = input; }}
            style={hidden}
          />
        </form>
      </span>
    )
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

class EditPencilForTableRow extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <td>
        <p onClick={this.props.clickAction}>
          <span className='glyphicon glyphicon-pencil edit'></span>
        </p>
      </td>
    );
  }
}

module.exports = {
  BackButton: BackButton,
  NextButton: NextButton,
  PickerButton: PickerButton,
  ActivePickerButton: ActivePickerButton,
  ActionButton: ActionButton,
  LoadFileButton: LoadFileButton,
  ItemHelpButton: ItemHelpButton,
  AssignButton: AssignButton,
  UnAssignButton: UnAssignButton,
  ItemMenuButton: ItemMenuButton,
  EditPencilForTableRow: EditPencilForTableRow
};
