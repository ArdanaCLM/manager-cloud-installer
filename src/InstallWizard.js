import React, { Component } from 'react';
import './Deployer.css';
import { translate } from './localization/localize.js';
import { stepProgressValues } from './components/StepProgressValues.js';
import WizardProgress from './components/WizardProgress';


/**
 * The InstallWizard component is a container for ordering the install pages and tracking some amount
 * of state across them.
 */
class InstallWizard extends Component {

  constructor(props)
  {
    super(props);

    this.state = this.initialState(props);

    // Load the current state information from the backend
    fetch('http://localhost:8081/api/v1/progress')
      .then(response => response.json())
      .then((responseData) =>
      {
        var progress = responseData || this.initialState(props);
        var forcedReset = (window.location.search.indexOf('reset=true') === -1) ? false : true;

        /**
         * if the state loaded from the backend has the pages in a different order than
         * expected by the UI, discard that state and use the default values
         */
        if(forcedReset || !this.areStepsInOrder(progress.steps, this.props.pages)) {
          progress = this.initialState(props);
        }

        this.setState({
          currentStep: progress.currentStep,
          steps: progress.steps,
          selectedModelName: progress.selectedModelName,
          currentlyDisplayedJSX: this.buildElement(progress.currentStep, progress.selectedModelName)
        }, this.persistState);
      });
  }

  initialState(props) {
    let state = {
      currentStep: 0,
      selectedModelName: '',
      steps: props.pages,
      currentlyDisplayedJSX: undefined    // this field is not persisted
    }

    state.steps[0].stepProgress = stepProgressValues.inprogress;
    return state;
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
   * creates a react compoennt representing the current step in the wizard based on the overall set of steps
   * and the current index
   * @param {Array} an array of objects representing the list of states, their indexes and state
   * @param {number} the current index (how far along in the wizard), a whole number matching some step index
   */
  buildElement(currentStep, selectedModelName) {
    var props = [];

    //check if first element
    if(currentStep !== 0) {
      props.back = this.stepBack.bind(this);
    }

    //check for additional steps
    if(currentStep < (this.props.pages.length - 1)) {
      props.next = this.stepForward.bind(this);
    }

    props.selectedModelName = selectedModelName;
    // pass a callback to update the selectedModelName.  Only used by the cloud model picker page
    props.updateModelName = this.updateModelName.bind(this);

    return React.createElement(this.props.pages[currentStep].component, props);
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
    fetch('http://localhost:8081/api/v1/progress', {
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
        stateUpdates.currentlyDisplayedJSX =
            this.buildElement(this.state.currentStep + 1, this.state.selectedModelName);
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
      stateUpdates.currentlyDisplayedJSX =
          this.buildElement(this.state.currentStep - 1 , this.state.selectedModelName);
    }
    stateUpdates.steps = steps;

    //setState is asynchronous, call the persistState function as a callback
    this.setState(stateUpdates, this.persistState);
  }

  updateModelName(modelName) {
    this.setState({selectedModelName: modelName}, this.persistState);
  }

  /**
   * boilerplate ReactJS render function
   */
  render()
  {
    let currentStepComponent = this.state.currentlyDisplayedJSX;

    if(currentStepComponent === undefined) {
      currentStepComponent = <div>{translate('wizard.loading.pleasewait')}</div>;
    }

    return(
      <div>
        <div className='wizardHeader'>
          <div className='heading'>
            {translate('openstack.cloud.deployer.title')}
          </div>
          <WizardProgress steps={this.state.steps} />
        </div>
        <div>
          {currentStepComponent}
        </div>
      </div>
    );
  }
}

export default InstallWizard;
