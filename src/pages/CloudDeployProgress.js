import React from 'react';

import { translate } from '../localization/localize.js';
import { ActionButton } from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';

const STEPS = [
  'All servers powered up',
  'All servers successfully bootstrapped',
  'Controller services deployed',
  'Compute nodes deployed',
  'Monitoring nodes deployed',
  'Storage nodes deployed',
  'Quick health check passed'
];

class CloudDeployProgress extends BaseWizardPage {
  constructor() {
    super();
    this.state = {
      currentStep: -1
    }
  }

  getError() {
    return (<div></div>);
  }

  getSteps() {
    // TODO get real log file from backend
    // fake the steps through progress button for now
    return STEPS.map((step, index) => {
      console.log('currentStep: ' + this.state.currentStep);
      var status = '';
      if (this.state.currentStep >= index) {
        if (Math.floor(this.state.currentStep/2) == index) {
          if (this.state.currentStep%2 == 0) {
            status = 'progressing';
          } else {
            status = 'succeed';
          }
        } else if (Math.floor(this.state.currentStep/2) > index) {
          status = 'succeed';
        }
      }
      console.log('status: ' + status);
      return (<li key={index} className={status}>{step}</li>);
    });
  }

  stepUp() {
    var now = this.state.currentStep + 1;
    this.setState({currentStep: now});
  }

  render() {
    var steps = STEPS.map((step, index) => {return (<li key={index}>{step}</li>);});
    var progress = 0;
    return (
      <div className='wizardContentPage'>
        {this.renderHeading(translate('deploy.progress.heading'))}
        <div className='deploy-progress'>
          <div className='body'>
            <div className='col-xs-6'>
              <ul>{this.getSteps()}</ul>
            </div>
            <div className='col-xs-6'>
              {this.getError()}
            </div>
          </div>
        </div>
        <div>
          <ActionButton
            displayLabel='progress'
            clickAction={() => this.stepUp()}/>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default CloudDeployProgress;
