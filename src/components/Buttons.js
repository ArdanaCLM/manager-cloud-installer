import React, { Component } from 'react';
import '../Deployer.css'
import { translate } from '../localization/localize.js';

class BackButton extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let buttonClass = "btn btn-primary btn-back";
        let buttonAction = this.props.clickAction;

        return (
            <button className={buttonClass} onClick={buttonAction}>
                {translate("back")}
            </button>
        );
    }
}

class NextButton extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        //add additional button class if it is specified
        let buttonClass = "btn btn-primary btn-next";
        //add disable class if it is disabled
        buttonClass =
            this.props.isDisabled ? buttonClass + ' ' + 'disabled' : buttonClass;

        let buttonAction = this.props.clickAction;

        return (
            <button className={buttonClass} onClick={buttonAction}>
                {translate("next")}
            </button>
        );
    }
}

class ActionButton extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        //add additional button class if it is specified
        let buttonClass = "btn btn-primary";
        //add disable class if it is disabled
        buttonClass =
            this.props.isDisabled ? buttonClass + ' ' + 'disabled' : buttonClass;

        let buttonAction = this.props.clickAction;
        let buttonLabel = this.props.displayLabel;

        return (
            <button className={buttonClass} onClick={buttonAction}>
                {buttonLabel}
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
        let classN = "picker-box " + (this.props.isSelected ? "selected" : '');
        let kName = this.props.keyName;
        return (
            <div className={classN} name={kName}
                 onClick={buttonAction}>{buttonLabel}</div>
        )
    }
}

class ItemHelpButton extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        let helpAction = this.props.clickAction;
        return (
            <span className="glyphicon glyphicon-question-sign helper" onClick={helpAction}></span>
        )
    }
}

module.exports = {
    BackButton: BackButton,
    NextButton: NextButton,
    PickerButton: PickerButton,
    ActionButton: ActionButton,
    ItemHelpButton: ItemHelpButton
}