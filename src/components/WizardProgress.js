import React, { Component } from 'react';
import { stepProgressValues } from './StepProgressValues.js';

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
          <span key={index} className="progress inprogress"/>
        );
      } else if(item.stepProgress === stepProgressValues.error) {
        return (
          <span key={index} className="progress error"/>
        );
      } else {
        return (
          <span key={index} className="progress notdone"/>
        );
      }
    });

    return(
      <div className="stateOuterWrapper">
        <div className="stateLineWrapper">
          <span>
            {stateBubbles}
          </span>
        </div>
      </div>
    );
  }
}

export default WizardProgress;
