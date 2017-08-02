import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import GenericPlaceHolder from './GenericPlaceHolder';

class InstallIntro extends GenericPlaceHolder {

  render() {
    return (
      <div className="generic-container">
        <div className="heading">{translate('welcome.cloud.install')}</div>
        <div className="footer-container">{this.renderNavButtons()}</div>
      </div>
    );
  }
}

export default InstallIntro;
