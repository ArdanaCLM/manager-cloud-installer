import React, { Component } from 'react';
import './Deployer.css';
import InstallWizard from './InstallWizard';
import { elementMapping , stepsInOrder, expectedPageOrder } from './components/WizardDefaults.js';

class Deployer extends Component {
  render() {
    return (
      <div>
        <InstallWizard
          elementMapping={elementMapping}
          stepsInOrder={stepsInOrder}
          expectedPageOrder={expectedPageOrder}/>
      </div>
    );
  }
}

export default Deployer;
