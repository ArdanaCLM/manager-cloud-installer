import React, { Component } from 'react';
import { stepProgressValues } from './../utils/StepProgressValues.js';

/**
 * Progress indicator showing the user how far along in the wizard they are
 * different color bubbles indicate whether a step is done, in-progress, error
 * or not started.
 */
class WizardProgress extends Component {
  render()
  {
    var stateBubbles = this.props.steps.map(function(item,index) {
      if(item.stepProgress === stepProgressValues.done) {
        return (
          <span key={index} className="progress done"/>
        );
      } else if(item.stepProgress === stepProgressValues.inprogress) {
        return (
          <span key={index} className="progress in-progress"/>
        );
      } else if(item.stepProgress === stepProgressValues.error) {
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
