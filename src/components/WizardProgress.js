// (c) Copyright 2017 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
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
        {stateBubbles}
      </div>
    );
  }
}

export default WizardProgress;
