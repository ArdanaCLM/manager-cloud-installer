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

  // The standard html control for getting a filename from a user is <input type="file">,
  // and while this is just a single DOM element, it is actually rendered visually as both
  // a button and a text field.  The behavior of this control is that when the button is
  // clicked, it pops up a dialog to the the user select a filename, but does not actually
  // try to attempt to load that file (it just populates the text field).  The implied
  // expectation is that there would be a submit button on this page that would then act
  // on that filename.
  //
  // But the behavior we want is to have a button that lets the user select a filename,
  // and then immediately act on that selected file.  On the surface, it would seem that
  // we could somehow disable the text field, but it turns out that that is rather
  // difficult to accomplish.  Furthermore, the button that is rendered as part of the
  // file input is also difficult to style in a way that is consistent with other buttons.
  //
  // So instead we take a "tricky" approach of creating the file input as a hidden DOM
  // element, and render our own button (which is easy to style), and when our button is
  // clicked, we pass the click event along to the hidden input.  We also listen for the
  // change event on that hidden file input so that when a file is selected, we receive
  // that event and propagate it to the caller.
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
            accept={this.props.extensions || '.csv'}
            ref={(input) => { this.hiddenButton = input; }}
            style={hidden}
          />
        </form>
      </span>
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

function AssignmentButton(props) {
  let cName = ' assignment-button';
  if (props.type === 'right') {
    cName = 'fa fa-angle-right' + cName;
    cName = cName + ' right-button';
  } else if (props.type === 'left') {
    cName = 'fa fa-angle-left' + cName;
  } else if (props.type === 'double-right') {
    cName = 'fa fa-angle-double-right' + cName;
  } else if (props.type === 'double-left') {
    cName = 'fa fa-angle-double-left' + cName;
  }
  cName = (props.isDisabled === true) ? cName + ' disabled' : cName;
  return (
    <span className={cName} onClick={props.clickAction}/>
  );
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
      <td className='actions'>
        <p onClick={this.props.clickAction}>
          <span className='glyphicon glyphicon-pencil edit'></span>
        </p>
      </td>
    );
  }
}

class InfoForTableRow extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <td className='actions'>
        <p onClick={this.props.clickAction}>
          <span className='glyphicon glyphicon-info-sign detail-info'></span>
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
  AssignmentButton: AssignmentButton,
  ItemMenuButton: ItemMenuButton,
  EditPencilForTableRow: EditPencilForTableRow,
  InfoForTableRow: InfoForTableRow
};
