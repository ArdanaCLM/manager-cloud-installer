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
import './Deployer.css';
import { translate } from './localization/localize.js';
import { STATUS } from './utils/constants.js';
import WizardProgress from './components/WizardProgress';
import { LoadingMask } from './components/LoadingMask.js';
import { Map, fromJS } from 'immutable';
import { fetchJson, postJson, deleteJson } from './utils/RestUtils.js';



/**
 * The InstallWizard component is a container for ordering the install pages and tracking
 * state across them.
 */
class InstallWizard extends Component {

  constructor(props)
  {
    super(props);

    this.state = {
      // The current step in the wizard
      currentStep: undefined,

      // The status and name of each step in the wizard.  If a user has an error in a step
      // and then returns to the previous step, this array will track the fact that the
      // later step had an error even though it is no longer the current step.
      steps: props.pages,

      // The remaining values capture the state of the user's progress through the wizard.  A primary
      // function of these values is so that if the user were to close the browser and then re-open it,
      // then the session should look nearly identical, including:
      // - the user should be on the same step in the wizard
      // - values entered by the user that are not stored anywhere else.  This includes values
      //   like credentials for remote systems, and so on.  Information that is already stored
      //   in the model, such as its name or which servers are assigned to which roles, should
      //   not be duplicated here since it is already being persisted in the model
      // playbookStatus structure example is like
      // [{
      //  name: 'dayzero-os-provision', status: '', playId: ''
      // }, {
      //  name: 'dayzero-pre-deployment', status: '', playId: ''
      // }, {
      //  name: 'dayzero-site', status: '', playId: ''
      // }]
      //
      playbookStatus: undefined,
      commitStatus: undefined, // to make it simple, we only have one to commit
      model: Map(),           // immutable model
      connectionInfo: undefined, // config info for external discovery services
      deployConfig: undefined, // cloud deployment configuration
    };


    // Indicate which of the above state variables are passed to wizard pages and can be set by them
    this.globalStateVars = ['commitStatus', 'playbookStatus', 'model', 'connectionInfo', 'deployConfig'];


    // Indicate which of the state variables will be persisted to, and loaded from, the progress API
    this.persistedStateVars = ['currentStep', 'steps', 'commitStatus', 'playbookStatus', 'connectionInfo'];

    // Note: if no progress data can be found, responseData is an empty string
    const forcedReset = window.location.search.indexOf('reset=true') !== -1;

    // Load the current state information from the backend

    // To simulate a delay in startup and to be able to see the initial loading mask,
    //    uncomment the following line and the line with the closing parenthesis two lines later
    // new Promise(resolve => setTimeout(resolve, 1000)).then(() =>
    fetchJson('/api/v1/clm/model')
      //  )
      .then(responseData => {
        this.setState({'model': fromJS(responseData)});
      })
      .catch((error) => {
        console.log('Unable to retrieve saved model');// eslint-disable-line no-console
      })
      .then(() => fetchJson('/api/v1/progress'))
      .then((responseData) => {
        if (! forcedReset && responseData.steps && this.areStepsInOrder(responseData.steps, this.props.pages)) {
          this.setState(responseData);
        } else {
          // Set the currentStep to 0 and update its stepProgress to inprogress
          this.setState((prevState) => {
            var newSteps = prevState.steps.slice();
            newSteps.splice(0, 1, {
              name: prevState.steps[0].name,
              stepProgress: STATUS.IN_PROGRESS
            });

            return {
              currentStep: 0,
              steps: newSteps
            };
          }, this.persistState);
        }})
      .then(() => {
        if (forcedReset) {
          return deleteJson('/api/v1/server?source=sm,ov,manual');
        }
      })
      .catch((error) => {
        this.setState({currentStep: 0}, this.persistState);
      });
  }

  /**
   * Checks two arrays of step objects against each other to make sure they're ordered the same
   * @param currentStateSteps
   * @param expectedOrder
   * @returns {boolean} true if the order matches, false otherwise
   */
  areStepsInOrder(currentStateSteps, expectedOrder) {

    if(currentStateSteps.length !== expectedOrder.length) {
      return false;
    }

    for(var i = 0; i < currentStateSteps.length; i++) {
      if(currentStateSteps[i].name !== expectedOrder[i].name) {
        return false;
      }
    }
    return true;
  }

  /**
   * creates a react component representing the current step in the wizard based on the overall set of steps
   * and the current index
   */
  buildElement() {
    if (this.state.currentStep === undefined) {
      return (<div className="loading-message">{translate('wizard.loading.pleasewait')}</div>);
    }

    let props = {};

    //check if first element
    if(this.state.currentStep !== 0) {
      props.back = this.stepBack.bind(this);
    }

    //check for additional steps
    if(this.state.currentStep < (this.props.pages.length - 1)) {
      props.next = this.stepForward.bind(this);
    }

    //Pass all global state vars as properties
    for (let v of this.globalStateVars) {
      props[v] = this.state[v];
    }
    //Pass the update function as a property
    props.updateGlobalState = this.updateGlobalState;

    //Pass functions to force a model save and reload
    props.saveModel = this.saveModel;
    props.loadModel = this.loadModel;

    return React.createElement(this.props.pages[this.state.currentStep].component, props);
  }

  /**
   * Writes the current install state out to persistent storage through an api in the shim
   * layer of the UI.
   */
  persistState = () => {
    let toPersist = {};
    for (let v of this.persistedStateVars) {
      toPersist[v] = this.state[v];
    }

    return postJson('/api/v1/progress', toPersist);
  }

  /**
   * Move the wizard forward one step unless there is an error
   * @param {boolean} isError - if an error has occurred, do not advance to the next step
   */
  stepForward(isError) {
    //TODO - update state setting logic to accept error states
    var steps = this.state.steps, stateUpdates = {};
    if(isError) {
      steps[this.state.currentStep].stepProgress = STATUS.FAILED;
    } else {
      steps[this.state.currentStep].stepProgress = STATUS.COMPLETE;


      //verify that there is a next page
      if (steps[(this.state.currentStep + 1)]) {
        //update the next step to inprogress
        steps[(this.state.currentStep + 1)].stepProgress = STATUS.IN_PROGRESS;

        //prepared to advance to the next page
        stateUpdates.currentStep = this.state.currentStep + 1;
      }
    }

    stateUpdates.steps = steps;
    //setState is asynchronous, call the persistState function as a callback
    this.setState(stateUpdates, this.persistState);
  }

  /**
   * Go back a step in the wizard
   * @param {boolean} isError - whether the current step has an error
   */
  stepBack(isError) {
    //TODO - update state setting logic to accept error states
    var steps = this.state.steps, stateUpdates = {};
    if(isError) {
      steps[this.state.currentStep].stepProgress = STATUS.FAILED;
    } else {
      steps[this.state.currentStep].stepProgress = STATUS.NOT_STARTED;
    }

    //verify that there is a previous page
    if(steps[(this.state.currentStep - 1)]) {
      //update previous step to inprogress
      steps[(this.state.currentStep - 1)].stepProgress = STATUS.IN_PROGRESS;

      //prepare to go back a page
      stateUpdates.currentStep = this.state.currentStep - 1;
    }
    stateUpdates.steps = steps;

    //setState is asynchronous, call the persistState function as a callback
    this.setState(stateUpdates, this.persistState);
  }

  /**
   * Set the wizard to a specific step in the workflow, can only be used to go to previous steps and not forward
   * @param {number} the step number to switch the wizard to
   */
  stepTo(stepNumber) {
    var steps = this.state.steps, stateUpdates = {};
    // sanity check the stepNumber, it must be greater than 0 and less than the current step
    if(stepNumber >= 0 && this.state.currentStep > stepNumber) {
      let i = this.state.currentStep;
      while(i > stepNumber) {
        steps[i].stepProgress = STATUS.NOT_STARTED;
        i--;
      }

      steps[stepNumber].stepProgress = STATUS.IN_PROGRESS;
      stateUpdates.currentStep = stepNumber;
      stateUpdates.steps = steps;
      this.setState(stateUpdates, this.persistState);
    }
  }

  // Setter functions for all state variables that need to be modified within pages.
  // If this list gets long, consider replacing it with a more generic function
  // that provides access to any
  updateGlobalState = (key, value, callback) => {

    let modelChanged = false;

    function mycallback() {
      let p;
      if (modelChanged) {
        // save the model
        p = this.saveModel();
      } else if (this.persistedStateVars.includes(key)) {
        // save the other state variables
        p = this.persistState();
      } else {
        // don't save it anywhere
        p = Promise.resolve(true);
      }

      p.then(() => {
        if (callback)
          callback();
      });
    }

    this.setState(prevState => {
      modelChanged = (key == 'model' && value !== prevState.model);

      let updatedState = {};
      updatedState[key] = value;
      return updatedState;
    }, mycallback);
  }

  // Pages within the installer may request that the model be forceably loaded
  // from disk, espcially when a change is made to directly to the model files
  // to the model.  Returns a promise
  loadModel = () => fetchJson('/api/v1/clm/model')
    .then(responseData => {
      this.setState({'model': fromJS(responseData)});
    })
    .catch((error) => {
      console.log('Unable to retrieve saved model');// eslint-disable-line no-console
    })

  // Pages within the installer may request that the model be saved to disk,
  // which is especially important when some significant change has been made
  // to the model.  Returns a promise
  saveModel = () => postJson('/api/v1/clm/model', this.state.model);

  /**
   * boilerplate ReactJS render function
   */
  render() {
    return (
      <div>
        <div className='wizard-header'>
          <h1>{translate('openstack.cloud.deployer.title')}</h1>
          <WizardProgress steps={this.state.steps} />
        </div>
        <div className='wizard-content-container'>
          <LoadingMask show={this.state.currentStep === undefined}></LoadingMask>
          {this.buildElement()}
        </div>
      </div>
    );
  }
}

export default InstallWizard;
