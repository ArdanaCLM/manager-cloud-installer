import React, { Component } from 'react';
import './Deployer.css';
import { translate } from './localization/localize.js';
import { getAppConfig } from './utils/ConfigHelper.js';
import { stepProgressValues } from './utils/StepProgressValues.js';
import WizardProgress from './components/WizardProgress';
import { LoadingMask } from './components/LoadingMask.js';


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
      //   like what model was selected, credentials for remote systems, and so on.
      //   Information that is already stored in the model should not be duplicated here since it is
      //   already being persisted in the model (e.g. which servers are assigned which roles).
      selectedModelName: '',  // name of the model selected
      sitePlayId: undefined   // play id of the deployment playbook
    };

    // Indicate which of the above state variables are passed to wizard pages and can be set by them
    this.globalStateVars = ['selectedModelName', 'sitePlayId'];

    // Indicate which of the state variables will be persisted to, and loaded from, the progress API
    this.persistedStateVars = ['currentStep', 'steps', 'selectedModelName', 'sitePlayId']

    // Note: if no progress data can be found, responseData is an empty string
    const forcedReset = window.location.search.indexOf('reset=true') !== -1;

    // Load the current state information from the backend

    // To simulate a delay in startup and to be able to see the initial loading mask,
    //    uncomment the following line and the line with the closing parenthesis two lines later
    // new Promise(resolve => setTimeout(resolve, 1000)).then(() =>
    fetch(getAppConfig('shimurl') + '/api/v1/progress')
    //  )
      .then(response => response.json())
      .then((responseData) =>
      {
        if (! forcedReset && responseData.steps && this.areStepsInOrder(responseData.steps, this.props.pages)) {
          this.setState(responseData);
        } else {
          // Set the currentStep to 0 and update its stepProgress to inprogress
          this.setState((prevState) => {
            var newSteps = prevState.steps.slice();
            newSteps.splice(0, 1, {
              name: prevState.steps[0].name,
              stepProgress: stepProgressValues.inprogress
            });

            return {
              currentStep: 0,
              steps: newSteps
            };
        }, this.persistState);
      }})
    .catch((error) => {
        this.setState({currentStep: 0}, this.persistState);
    });

    if (forcedReset) {
      fetch(getAppConfig('shimurl') + '/api/v1/server?source=sm,ov,manual', {
        method: 'DELETE'
      })
    }
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

    // Note that JSON.stringify silently ignores React components, so they
    // don't get saved
    fetch(getAppConfig('shimurl') + '/api/v1/progress', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(toPersist)
    });
  }

  /**
   * Move the wizard forward one step unless there is an error
   * @param {boolean} isError - if an error has occurred, do not advance to the next step
   */
  stepForward(isError) {
    //TODO - update state setting logic to accept error states
    var steps = this.state.steps, stateUpdates = {};
    if(isError) {
      steps[this.state.currentStep].stepProgress = stepProgressValues.error;
    } else {
      steps[this.state.currentStep].stepProgress = stepProgressValues.done;


      //verify that there is a next page
      if (steps[(this.state.currentStep + 1)]) {
        //update the next step to inprogress
        steps[(this.state.currentStep + 1)].stepProgress = stepProgressValues.inprogress;

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
      steps[this.state.currentStep].stepProgress = stepProgressValues.error;
    } else {
      steps[this.state.currentStep].stepProgress = stepProgressValues.notdone;
    }

    //verify that there is a previous page
    if(steps[(this.state.currentStep - 1)]) {
      //update previous step to inprogress
      steps[(this.state.currentStep - 1)].stepProgress = stepProgressValues.inprogress;

      //prepare to go back a page
      stateUpdates.currentStep = this.state.currentStep - 1;
    }
    stateUpdates.steps = steps;

    //setState is asynchronous, call the persistState function as a callback
    this.setState(stateUpdates, this.persistState);
  }

  // Setter functions for all state variables that need to be modified within pages.
  // If this list gets long, consider replacing it with a more generic function
  // that provides access to any
  updateGlobalState = (key, value) => {
    if (this.globalStateVars.includes(key)) {
      var updatedState = {}
      updatedState[key] = value;
      this.setState(updatedState, this.persistState);
    }
  }

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
