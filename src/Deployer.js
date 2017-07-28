import React, { Component } from 'react'
import './Deployer.css'
import InstallWizard from './InstallWizard'

class Deployer extends Component {
  render() {
    return (
      <div>
          <InstallWizard/>
      </div>
    );
  }
}

export default Deployer;
