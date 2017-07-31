import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';

/**
 * This is just a temporary placeholder component to show an example of a page that has
 * forward and back buttons in the wizard
 */
class GenericPlaceHolder extends Component {

  /**
  * function to go back a page, this depends on a callback function being passed
  * into this class via props, and will call that function after any local changes
  * @param {Event} the click event on the goBack button
  */
  goBack(e) {
    e.preventDefault();
    //if going back involved unsetting some parameters, do that here
    //if error checking on 'goBack' (not required) do so here
    var isError = false;
    this.props.back(isError);
  }

  /**
  * function to go forward a page, this depends on a callback function being passed
  * into this class via props, and will call that function after any local changes
  * This function should be where error checking occurs
  * @param {Event} the click event on the goForward button
  */
  goForward(e) {
    e.preventDefault();
    //typical pages would do some validation here before deciding to advance
    var isError = false;
    this.props.next(isError);
  }


  render() {
    let forward = null;
    if(this.props.next !== undefined) {
      forward = <button onClick={this.goForward.bind(this)}>
        {translate('next')}
      </button>;
    }

    return (
      <div>
        {translate('generic.placeholder.heading')}
        <button onClick={this.goBack.bind(this)}>
          {translate('back')}
        </button>
        {forward}
      </div>
    );
  }
}

export default GenericPlaceHolder;
