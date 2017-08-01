import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage';

/**
 * This is just a temporary placeholder component to show an example of a page that has
 * forward and back buttons in the wizard
 */
class MyPage extends BaseWizardPage {

  render() {

    return (
      <div className='generic-container'>
        {this.renderHeading('my Page Here')}
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default MyPage;
