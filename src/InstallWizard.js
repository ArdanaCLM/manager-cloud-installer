import React, { Component } from 'react';
import './App.css';
//import { translate } from './localization/localize.js';
import CloudModelPicker from './pages/CloudModelPicker';
import GenericPlaceHolder from './pages/GenericPlaceHolder';
import InstallIntro from './pages/InstallIntro';
import WizardProgress from './components/WizardProgress';

class InstallWizard extends Component {
    constructor()
    {
        super();
        this.state = {
            step: 0,
            steps: [
		{ 
		    index: 0,
		    state: 0,
		    jsx: <InstallIntro next={this.stepForward.bind(this)}/>
		},
		{
		    index: 1,
		    state: 0,
                    jsx: <CloudModelPicker next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
	        },
		{
		    index: 2,
		    state: 0,
                    jsx: <GenericPlaceHolder next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
	        },
		{
		    index: 3,
		    state: 0,
                    jsx: <GenericPlaceHolder next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
	        },
		{
		    index: 4,
		    state: 0,
                    jsx: <GenericPlaceHolder next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
	        },
		{
		    index: 5,
		    state: 0,
                    jsx: <GenericPlaceHolder next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
	        },
		{
		    index: 6,
		    state: 0,
                    jsx: <GenericPlaceHolder next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
	        },
		{
		    index: 7,
		    state: 0,
                    jsx: <GenericPlaceHolder back={this.stepBack.bind(this)} />
	        }
	    ]
        };
    }

    stepForward(){
	//TODO - update state setting logic to account for more complex scenarios
	var steps = this.state.steps;
	steps[this.state.step].state = 1;
	this.setState({steps : steps});
	//advance to the next page
        this.setState({step: this.state.step + 1});
    }

    stepBack(){
        this.setState({step: this.state.step - 1});
    }

    render()
    {
	    let currentStepComponent = this.state.steps[this.state.step].jsx;
	    if(currentStepComponent === undefined){
		    currentStepComponent = <InstallIntro />;
	    }

	    return(
		<div>
		    Welcome to SUSE Openstack Cloud Installer
		    <WizardProgress steps={this.state.steps} currentStep={this.state.step} />
		    <div>
		        {currentStepComponent}
		    </div>
	        </div>
	    )
    }
}

export default InstallWizard;
