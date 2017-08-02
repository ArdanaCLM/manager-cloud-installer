import React from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage';

class InstallIntro extends BaseWizardPage {

  render() {
    return (
      <div className='generic-container'>
        {this.renderHeading(translate('welcome.cloud.install'))}
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default InstallIntro;
