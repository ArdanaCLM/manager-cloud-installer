import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';

class BackButton extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let buttonClass = 'btn btn-primary btn-back';

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
    let buttonClass = 'btn btn-primary btn-next';
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
    let buttonClass = 'btn btn-primary';
    buttonClass =
      this.props.isDisabled ? buttonClass + ' ' + 'disabled' : buttonClass;

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
    let buttonAction = this.props.clickAction;
    let buttonLabel = this.props.displayLabel;
    let classN = 'picker-card ' + (this.props.isSelected ? 'selected' : '');
    let kName = this.props.keyName;
    return (
      <div className={classN} name={kName}
        onClick={buttonAction}>{buttonLabel}</div>
    );
  }
}

class ActivePickerButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cardClass: 'card',
    };

    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleClick = this.handleClick.bind(this);

  }

  handleMouseEnter(e) {
    if (this.props.handleMouseEnter) {
      this.props.handleMouseEnter(e);
    }
    this.setState({
      cardClass: 'card-active'
    });
  }

  handleMouseLeave(e) {
    this.setState({
      cardClass: 'card'
    });
  }

  handleClick(e) {
    e.preventDefault();
    this.props.handleClick(e);
  }

  render () {
    return (
      <div className='col-xs-3 text-center model-elements margin-top-10'>
        <div
          id={this.props.id}
          className={this.state.cardClass}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          onClick={this.handleClick}
          value={this.props.value} >
          <p className='glyphicon glyphicon-pencil edit-icon pull-right'></p>
          <p className='card-text-unit'
            id={this.props.id}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            onClick={this.handleClick}>
            {this.props.value}
          </p>

          <h3
            id={this.props.id}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            onClick={this.handleClick}>
            {this.props.description}
          </h3>
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
        className='glyphicon glyphicon-question-sign helper'
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
