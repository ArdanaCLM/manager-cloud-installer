import React, { Component } from 'react';
import './App.css';
//import { translate } from './localization/localize.js';
import CloudModelPicker from './pages/CloudModelPicker';
import InstallIntro from './pages/InstallIntro';

class InstallWizard extends Component {
    constructor()
    {
        super();
        this.state = {
            step: 0
        };
    }

    stepForward(){
        this.setState({step: this.state.step + 1});
    }

    stepBack(){
        this.setState({step: this.state.step - 1});
    }

    render()
    {
        switch (this.state.step) {
            case 0:
                return <InstallIntro next={this.stepForward.bind(this)}/>
            case 1:
                return <CloudModelPicker back={this.stepBack.bind(this)}/>
            default:
                return <InstallIntro />
        }
    }
}

export default InstallWizard;