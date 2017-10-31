// (c) Copyright 2017 SUSE LLC
import React, { Component } from 'react';
import './Deployer.css';
import InstallWizard from './InstallWizard';
import { pages } from './utils/WizardDefaults.js';

class Deployer extends Component {
  render() {
    return (
      <div>
        <InstallWizard pages={pages}/>
      </div>
    );
  }
}

export default Deployer;
