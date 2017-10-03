import React from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage';

class Complete extends BaseWizardPage {

  render() {
    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('complete.heading'))}
        </div>
        <div className='wizard-content'>
          <div className='installIntro'>
            <div className='topLine'>{translate('complete.message.body')}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default Complete;
