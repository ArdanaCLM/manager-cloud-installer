import React, { Component } from 'react';
import './Deployer.css';
import { translate } from './localization/localize.js';
import { getAppConfig } from './utils/ConfigHelper.js';
import { stepProgressValues } from './utils/StepProgressValues.js';
import WizardProgress from './components/WizardProgress';
import { LoadingMask } from './components/LoadingMask.js';
import { Map, fromJS } from 'immutable';
import { fetchJson, postJson } from './utils/RestUtils.js';



/**
 * The InstallWizard component is a container for ordering the install pages and tracking
 * state across them.
 */
class InstallWizard extends Component {

  constructor(props)
  {
    super(props);

    //displaymode "constants" indicating how the progress controls should be rendered
    this.displayModeHeader = 0;
    this.displayModeSideBar = 1;

    this.state = {
      //Whether the wizard step progress is displayed via a header or via a side-nav bar
      displayMode: this.displayModeHeader,

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
      sitePlayId: undefined,  // play id of the deployment playbook
      model: Map(),           // immutable model
      connectionInfo: undefined,
    };

    // Indicate which of the above state variables are passed to wizard pages and can be set by them
    this.globalStateVars = ['sitePlayId', 'model', 'connectionInfo'];

    // Indicate which of the state variables will be persisted to, and loaded from, the progress API
    this.persistedStateVars = ['currentStep', 'steps', 'sitePlayId', 'connectionInfo'];

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
        console.log('Unable to retrieve saved model');
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
              stepProgress: stepProgressValues.inprogress
            });

            return {
              currentStep: 0,
              steps: newSteps
            };
          }, this.persistState);
        }})
      .then(() => {
        if (forcedReset) {
          return fetch(getAppConfig('shimurl') + '/api/v1/server?source=sm,ov,manual', {
            method: 'DELETE'
          });
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

    //Pass a function to force a model save
    props.saveModel = this.saveModel;

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
        steps[i].stepProgress = stepProgressValues.notdone;
        i--;
      }

      steps[stepNumber].stepProgress = stepProgressValues.inprogress;
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

  // Pages within the installer may request that the model be saved to disk,
  // which is especially important when some significant change has been made
  // to the model.  Returns a promise
  saveModel = () => postJson('/api/v1/clm/model', this.state.model);

  /**
   * changes the displaymode from showing the header to sidebar
   * @param {Number} the displaymode constant for changing the wizard displaymode
   */
  setDisplayMode(newMode) {
    this.setState({displayMode: newMode});
  }

  /**
   * renders the header for the overall application, if the displaymode is such that the header is
   * not to be rendered, returns undefined
   * @return {jsx} the jsx representation of the header
   */
  renderHeader() {
    if(this.state.displayMode === this.displayModeHeader) {
      return (
        <div className='wizard-header'>
          <i className='menutoggle material-icons btn-toggle'
            onClick={() => this.setDisplayMode(this.displayModeSideBar)}>menu</i>
          <h1>{translate('openstack.cloud.deployer.title')}</h1>
          <WizardProgress steps={this.state.steps} />
        </div>
      );
    }
  }

  /**
   * renders the sidebar for the overall application, which lists the steps and highlights the
   * current step. If the displaymode is such that the header is not rendered, returns undefined
   * @return {jsx} the jsx representation of the sidebar
   */
  renderSidebar() {
    if(this.state.displayMode === this.displayModeSideBar) {
      return (
        <div className='wizard-sidebar col-sm-2'>
          <h1>{translate('openstack.cloud.deployer.title')}</h1>
          <div className='togglewrap'>
            <i className='menutoggle material-icons btn-toggle'
              onClick={() => this.setDisplayMode(this.displayModeHeader)}>menu</i>
          </div>
          {
            this.state.steps.map((item, index) => {
              let stepClass = 'stepItem';
              let onClickFnct = undefined;
              if(this.state.currentStep > index) {
                stepClass = 'stepItem prevstep';
                onClickFnct = () => {
                  this.stepTo(index);
                };
              }
              if(this.state.currentStep === index) {
                stepClass = 'stepItem currentstep';
              }
              return <div key={index}
                className={stepClass}
                onClick={onClickFnct}>
                {translate('clouddeploy.installsteps.' + item.name)}</div>;
            })
          }
        </div>
      );
    }
  }

  /**
   * boilerplate ReactJS render function
   */
  render() {
    let contentCssClass = 'wizard-content-container';
    if(this.state.displayMode === this.displayModeSideBar) {
      contentCssClass = 'wizard-content-container col-sm-10';
    } else if(this.state.displayMode === this.displayModeHeader) {
      contentCssClass = 'wizard-content-container hasHeader';
    }
    return (
      <div>
        {this.renderHeader()}
        {this.renderSidebar()}
        <div className={contentCssClass}>
          <LoadingMask show={this.state.currentStep === undefined}></LoadingMask>
          {this.buildElement()}
        </div>
      </div>
    );
  }
}

export default InstallWizard;
