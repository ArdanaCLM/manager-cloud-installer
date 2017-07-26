import React, { Component } from 'react'
import './Deployer.css'
import InstallWizard from './InstallWizard'

class Deployer extends Component {
  render() {
    return (
      <div>
        <div className="container">
          <div className="well">
            <h1>I am the mighty SUSE Cloud Deployer</h1>
          </div>
        </div>
      </div>
    );
  }
}

export default Deployer;
