import React, { Component } from 'react';
import './Deployer.css';
import { translate } from './localization/localize.js';
import { getAppConfig } from './components/ConfigHelper.js';
import { stepProgressValues } from './components/StepProgressValues.js';
import WizardProgress from './components/WizardProgress';
import { LoadingMask } from './components/LoadingMask.js';


/**
 * The InstallWizard component is a container for ordering the install pages and tracking some amount
 * of state across them.
 */
class InstallWizard extends Component {

  constructor(props)
  {
    super(props);

    this.state = {
      // The current step in the wizard
      currentStep: undefined,

      // The status of each step in the wizard.  If a user has an error in a step
      // and then returns to the previous step, this array will track the fact that the
      // later step had an error even though it is no longer the current step.
      steps: props.pages,

      // The remaining values capture the state of the user's progress through the wizard.  The primary
      // purpose of these values is so that if a user were to close the browser and then re-open it,
      // then the session should look nearly identical, including:
      // - the user should be on the same step in the wizard
      // - values entered by the user that are not stored anywhere else should be retained.  This
      //   includes values like what model was selected, credentials for remote systems, and so on.
      //   Information that is already stored in the model should not be included, since it is
      //   already being persisted in the model (e.g. which servers are assigned which roles).
      //
      selectedModelName: ''
    };

    // Load the current state information from the backend

    // To simulate a delay in startup and to be able to see the initial loading mask,
    //    uncomment the following line and the line with the closing parenthesis two lines later
    // new Promise(resolve => setTimeout(resolve, 1000)).then(() =>
    fetch(getAppConfig('shimurl') + '/api/v1/progress')
    //  )
      .then(response => response.json())
      .then((responseData) =>
      {
        // Note: if no progress data can be found, responseData is an empty string
        const forcedReset = window.location.search.indexOf('reset=true') !== -1;

        if (! forcedReset && responseData.steps && this.areStepsInOrder(responseData.steps, this.props.pages)) {
          this.setState(responseData);
        } else {
          // No data was loaded, so set the currentStep to 0 and update its stepProgress to inprogress
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
        });
      }})
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

    let props = [];

    //check if first element
    if(this.state.currentStep !== 0) {
      props.back = this.stepBack.bind(this);
    }

    //check for additional steps
    if(this.state.currentStep < (this.props.pages.length - 1)) {
      props.next = this.stepForward.bind(this);
    }

    props.selectedModelName = this.state.selectedModelName;
    // pass a callback to update the selectedModelName.  Only used by the cloud model picker page
    props.updateModelName = this.updateModelName;

    return React.createElement(this.props.pages[this.state.currentStep].component, props);
  }

  /**
   * Writes the current install state out to persistent storage through an api in the shim
   * layer of the UI.
   */
  persistState() {
    let stateToPersist = {
      'currentStep': this.state.currentStep,
      'steps': this.state.steps,
      'selectedModelName': this.state.selectedModelName
    };

    // Note that JSON.stringify silently ignores React components, so they
    // don't get saved
    fetch(getAppConfig('shimurl') + '/api/v1/progress', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stateToPersist)
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

  updateModelName = (modelName) => {
    this.setState({selectedModelName: modelName}, this.persistState);
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
        <div>
          <LoadingMask show={this.state.currentStep === undefined}></LoadingMask>
          {this.buildElement()}
        </div>
      </div>
    );
  }
}

export default InstallWizard;
