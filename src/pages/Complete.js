import React from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage';

class Complete extends BaseWizardPage {

  render() {
    return (
      <div className='wizardContentPage'>
        {this.renderHeading(translate('complete.heading'))}
        <div className='installIntro'>
          <div className='topLine'>{translate('complete.message.body')}</div>
        </div>
      </div>
    );
  }
}

export default Complete;
