import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import { ActionButton } from '../components/Buttons.js';
import BaseWizardPage from './BaseWizardPage.js';

const STEPS = [
  translate('deploy.progress.step1'),
  translate('deploy.progress.step2'),
  translate('deploy.progress.step3'),
  translate('deploy.progress.step4'),
  translate('deploy.progress.step5'),
  translate('deploy.progress.step6'),
  translate('deploy.progress.step7')
];

class Progress extends BaseWizardPage {
  constructor() {
    super();
    this.state = {
      currentStep: 0,
      currentProgress: -1,
      errorMsg: ''
    };
  }

  getError() {
    return (this.state.errorMsg) ? (
      <div>{translate('deploy.progress.failure', STEPS[this.state.currentStep])}<br/>
        <pre className='log'>{this.state.errorMsg}</pre></div>) : (<div></div>);
  }

  getProgress() {
    return STEPS.map((step, index) => {
      var status = '';
      if (this.state.currentProgress >= index) {
        if (this.state.currentProgress >= 13 && index == 6) {
          status = (this.state.currentProgress == 13) ? 'fail' : 'succeed';
        } else {
          if (Math.floor(this.state.currentProgress/2) == index) {
            if (this.state.currentProgress%2 == 0) {
              status = 'progressing';
            } else {
              status = 'succeed';
            }
          } else if (Math.floor(this.state.currentProgress/2) > index) {
            status = 'succeed';
          }
        }
      }
      return (<li key={index} className={status}>{step}</li>);
    });
  }

  progressing() {
    // TODO get real log file from backend
    // fake the steps through progress button for now
    var now = this.state.currentProgress + 1;
    this.setState({currentProgress: now, currentStep: Math.floor(this.state.currentProgress/2)});
    if (this.state.currentProgress == 12) {
      this.setState({errorMsg: 'something is wrong here, please do something'});
    }
    if (this.state.currentProgress == 13) {
      this.setState({errorMsg: ''});
    }
  }

  render() {
    return (
      <div className='wizardContentPage'>
        {this.renderHeading(translate('deploy.progress.heading'))}
        <div className='deploy-progress'>
          <div className='body'>
            <div className='col-xs-6'>
              <ul>{this.getProgress()}</ul>
            </div>
            <div className='col-xs-6'>
              {this.getError()}
            </div>
          </div>
        </div>
        <div>
          <ActionButton
            displayLabel='progress'
            clickAction={() => this.progressing()}/>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

class CloudDeployProgress extends Component {
  render() {
    // TODO take out the back button when dev mode implementation is ready
    // return (<Progress next={this.props.next}/>);
    return (<Progress back={this.props.back} next={this.props.next}/>);
  }
}

export default CloudDeployProgress;
