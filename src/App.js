import React, { Component } from 'react';
import './App.css';
//import ArdanaServerList from './sandbox/ardanaServerList';
import InstallWizard from './InstallWizard';

class App extends Component {
  render() {
    return (
        //<ArdanaServerList/>
        <InstallWizard />
    );
  }
}

export default App;
