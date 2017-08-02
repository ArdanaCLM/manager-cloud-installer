import React from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage.js';

/**
 * This is just a temporary placeholder component to show an example of a page that has
 * forward and back buttons in the wizard
 */
class GenericPlaceHolder extends BaseWizardPage {

  render() {

    return (
      <div className="generic-container">
        <div className="heading">{translate('generic.placeholder.heading')}</div>
        <div className="footer-container">{this.renderNavButtons()}</div>
      </div>
    );
  }
}

export default GenericPlaceHolder;
