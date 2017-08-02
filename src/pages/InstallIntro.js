import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import GenericPlaceHolder from './GenericPlaceHolder';

class InstallIntro extends GenericPlaceHolder {

  render() {
    return (
      <div>
        {translate('welcome.cloud.install')}
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default InstallIntro;
