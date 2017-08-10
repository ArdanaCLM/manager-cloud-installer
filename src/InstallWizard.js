import React, { Component } from 'react';
import './Deployer.css';
import { translate } from './localization/localize.js';
import { stepStateValues } from './components/StepStateValues.js';
import WizardProgress from './components/WizardProgress';


/**
 * The InstallWizard component is a container for ordering the install pages and tracking some amount
 * of state across them.
 */
class InstallWizard extends Component {
  constructor()
  {
    super();

    //Load the current state information from the backend
    //TODO - replace with query to real backend once the backend is implemented
    fetch('http://localhost:8081/api/v1/progress')
      .then(response => response.json())
      .then((responseData) =>
      {
        var wizardProgress = responseData || {
          currentState: {
            step: 0,
            state: stepStateValues.notdone,
          },
          steps: [],
          jsx: undefined,
          selectedModelName: ''
        };

        var currentIndex = wizardProgress.currentState.step;
        var currentState = wizardProgress.currentState.state;
        var forcedReset = (window.location.search.indexOf('installreset=true') === -1) ? false : true;

        /**
         * if the state loaded from the backend has the pages in a different order than
         * expected by the UI, discard that state and use the default values
         */
        if(forcedReset ||
            !this.props.stepsInOrder(wizardProgress.steps, this.props.expectedPageOrder)) {
          wizardProgress.steps = this.props.expectedPageOrder;
          currentState = stepStateValues.inprogress;
          currentIndex = 0;
        }

        if(currentState !== stepStateValues.error && currentIndex === 0) {
          currentState = stepStateValues.inprogress;
          wizardProgress.steps[currentIndex].state = stepStateValues.inprogress;
        }

        var selectedModelName = wizardProgress.selectedModelName;
        this.setState({
          step: currentIndex,
          state: currentState,
          steps: wizardProgress.steps,//need these to write them back to the state object later
          jsx: this.buildElement(wizardProgress.steps, currentIndex, selectedModelName),
          selectedModelName: selectedModelName
        });

        this.persistState();
      });

    //some default values so that the render function won't error out on startup
    this.state = {
      step: 0,
      state: 0,
      steps: [],//need these to write them back to the state object later
      jsx: undefined,
      selectedModelName: ''
    };
  }

  /**
   * creates a JSX element representing the current step in the wizard based on the overall set of steps
   * and the current index
   * @param {Array} an array of objects representing the list of states, their indexes and state
   * @param {number} the current index (how far along in the wizard), a whole number matching some step index
   */
  buildElement(steps, currentIndex, selectedModelName) {
    var i, stepElement = undefined;
    for(i = 0; i < steps.length; i++) {
      if(steps[i].index === currentIndex) {
        var props = [];

        //check if first element
        if(i !== 0) {
          props.back = this.stepBack.bind(this);

        }

        //check for additional steps
        if(i < (steps.length - 1)) {
          props.next = this.stepForward.bind(this);
        }

        //TODO: pass selectedModelName to all the step
        //once we figure out how pass around model name...we know how to pass around the
        //model object
        props.selectedModelName = selectedModelName;
        //idea here is use this when select model in model picker
        //call this callback to update the selectedModelName here
        props.updateModelName = this.updateModelName.bind(this);
        stepElement = React.createElement(this.props.elementMapping[steps[i].jsxelement], props);
        break;
      }
    }

    return stepElement;
  }

  /**
   * Writes the current install state out to persistent storage through an api in the shim
   * layer of the UI. This is presently a placeholder
   * //TODO - real implementation of this once backend is available
   */
  persistState() {
    let stateToPersist = {
      'currentState': {
        'step': this.state.step,
        'state': this.state.state
      },
      'steps': this.state.steps,
      'selectedModelName': this.state.selectedModelName
    };

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
      steps[this.state.step].state = stepStateValues.error;
    } else {
      steps[this.state.step].state = stepStateValues.done;


      //verify that there is a next page
      if (steps[(this.state.step + 1)]) {
        //update the next step to inprogress
        steps[(this.state.step + 1)].state = stepStateValues.inprogress;

        //prepared to advance to the next page
        stateUpdates.step = this.state.step + 1;
        stateUpdates.jsx =
            this.buildElement(this.state.steps, this.state.step + 1, this.state.selectedModelName);
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
      steps[this.state.step].state = stepStateValues.error;
    } else {
      steps[this.state.step].state = stepStateValues.notdone;
    }

    //verify that there is a previous page
    if(steps[(this.state.step - 1)]) {
      //update previous step to inprogress
      steps[(this.state.step - 1)].state = stepStateValues.inprogress;

      //prepare to go back a page
      stateUpdates.step = this.state.step - 1;
      stateUpdates.jsx =
          this.buildElement(this.state.steps, this.state.step - 1 , this.state.selectedModelName);
    }
    stateUpdates.steps = steps;

    //setState is asynchronous, call the persistState function as a callback
    this.setState(stateUpdates, this.persistState);
  }

  //TODO experimental
  updateModelName(modelName) {
    //don't want to render all the UI
    this.state.selectedModelName = modelName;
  }

  /**
   * boilerplate ReactJS render function
   */
  render()
  {
    let currentStepComponent = this.state.jsx;

    if(currentStepComponent === undefined) {
      currentStepComponent = <div>{translate('wizard.loading.pleasewait')}</div>;
    }

    return(
      <div>
        <div className='wizardHeader'>
          <div className='heading'>
            {translate('openstack.cloud.deployer.title')}
          </div>
          <WizardProgress steps={this.state.steps} currentStep={this.state.step} />
        </div>
        <div>
          {currentStepComponent}
        </div>
      </div>
    );
  }
}

export default InstallWizard;
