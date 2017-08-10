import React, { Component } from 'react';
import '../Deployer.css';
//import { translate } from '../localization/localize.js';

import {
  NextButton,
  BackButton,
} from '../components/Buttons.js';


/**
 * This base class handles the generic back and forward navigation that is common to
 * most wizard pages.
 */
class BaseWizardPage extends Component {

  /**
   * function to determine whether the page is in an error state.  Subclasses 
   * should override this and return true to prevent navigation
   */
  isError() {
    return false;
  }

  /**
  * function to go back a page, this depends on a callback function being passed
  * into this class via props, and will call that function after any local changes
  * @param {Event} the click event on the goBack button
  */
  goBack(e) {
    e.preventDefault();
    this.props.back(false);
  }

  /**
  * function to go forward a page, this depends on a callback function being passed
  * into this class via props, and will call that function after any local changes
  * This function should be where error checking occurs
  * @param {Event} the click event on the goForward button
  */
  goForward(e) {
    e.preventDefault();
    this.props.next(this.isError());
  }

  setNextButtonLabel() {
    return null;
  }

  setNextButtonDisabled() {
    return false;
  }

  renderNavButtons() {

    let back = null;
    if(this.props.back !== undefined) {
      back= <BackButton clickAction={this.goBack.bind(this)}/>;
    }

    let forward = null;
    if(this.props.next !== undefined) {
      forward = <NextButton
        clickAction={this.goForward.bind(this)}
        displayLabel={this.setNextButtonLabel()}
        disableCondition={this.setNextButtonDisabled()}
      />;
    }

    return (
      <div className='footer-container'>
        {back}
        {forward}
      </div>
    );
  }

  renderHeading(text) {
    return (
      <div className='heading'>{text}</div>
    );
  }


}

export default BaseWizardPage;
