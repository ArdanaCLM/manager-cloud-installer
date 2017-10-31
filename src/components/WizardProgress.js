// (c) Copyright 2017 SUSE LLC
import React, { Component } from 'react';
import { STATUS } from './../utils/constants.js';

/**
 * Progress indicator showing the user how far along in the wizard they are
 * different color bubbles indicate whether a step is done, in-progress, error
 * or not started.
 */
class WizardProgress extends Component {
  render()
  {
    var stateBubbles = this.props.steps.map(function(item,index) {
      if(item.stepProgress === STATUS.COMPLETE) {
        return (
          <span key={index} className="progress done"/>
        );
      } else if(item.stepProgress === STATUS.IN_PROGRESS) {
        return (
          <span key={index} className="progress in-progress"/>
        );
      } else if(item.stepProgress === STATUS.FAILED) {
        return (
          <span key={index} className="progress error"/>
        );
      } else {
        return (
          <span key={index} className="progress not-done"/>
        );
      }
    });

    return(
      <div className="wizard-progress-container">
        <span>
          {stateBubbles}
        </span>
      </div>
    );
  }
}

export default WizardProgress;
