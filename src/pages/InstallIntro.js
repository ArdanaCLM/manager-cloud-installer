import React from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage';

class InstallIntro extends BaseWizardPage {
  getSteps() {
    var lines = [];
    for (var i=1; i<7; i++) {
      lines.push(<li>{translate('install.intro.message.step' + i)}</li>);
    }
    return (<ul>{lines}</ul>);
  }

  render() {
    return (
      <div className='generic-container'>
        {this.renderHeading(translate('welcome.cloud.install'))}
        <div className='installIntro'>
          <div className='col-xs-7'>
            <div className='topLine'>{translate('install.intro.message.body1')}</div>
            <div>{translate('install.intro.message.body2')}</div>
          </div>
          <div className='col-xs-1'></div>
          <div className='col-xs-4'>
            <div className='heading'>{translate('install.intro.message.steps.heading')}</div>
            {this.getSteps()}
          </div>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default InstallIntro;
