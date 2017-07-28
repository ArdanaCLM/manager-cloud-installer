import React, { Component } from 'react';
import './App.css';
import { translate } from './localization/localize.js';
import { stepStateValues } from './components/StepStateValues.js';
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
                state: stepStateValues.inprogress,
                jsx: <InstallIntro next={this.stepForward.bind(this)}/>
            },
            {
                index: 1,
                state: stepStateValues.notdone,
                jsx: <CloudModelPicker next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
            },
            {
                index: 2,
                state: stepStateValues.notdone,
                jsx: <GenericPlaceHolder next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
            },
            {
                index: 3,
                state: stepStateValues.notdone,
                jsx: <GenericPlaceHolder next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
            },
            {
                index: 4,
                state: stepStateValues.notdone,
                jsx: <GenericPlaceHolder next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
            },
            {
                index: 5,
                state: stepStateValues.error,
                jsx: <GenericPlaceHolder next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
            },
            {
                index: 6,
                state: stepStateValues.notdone,
                jsx: <GenericPlaceHolder next={this.stepForward.bind(this)} back={this.stepBack.bind(this)}/>
            },
            {
                index: 7,
                state: stepStateValues.notdone,
                jsx: <GenericPlaceHolder back={this.stepBack.bind(this)} />
            }]
        };
    }

    stepForward(isError){
        //TODO - update state setting logic to accept error states
        var steps = this.state.steps;
        if(isError){
            steps[this.state.step].state = stepStateValues.error;
        } else {
            steps[this.state.step].state = stepStateValues.done;
        }

        //verify that there is a next page
        if(steps[(this.state.step + 1)]){
            //update the next step to inprogress
            steps[(this.state.step + 1)].state = stepStateValues.inprogress;

            //advance to the next page
            this.setState({step: this.state.step + 1});
        }
        this.setState({steps : steps});
    }

    stepBack(isError){
        //TODO - update state setting logic to accept error states
        var steps = this.state.steps;
        if(isError){
            steps[this.state.step].state = stepStateValues.error;
        } else {
            steps[this.state.step].state = stepStateValues.notdone;
        }

        //verify that there is a previous page
        if(steps[(this.state.step - 1)]){
            //update previous step to inprogress
            steps[(this.state.step - 1)].state = stepStateValues.inprogress;

            //go back a page
            this.setState({step: this.state.step - 1});
        }
        this.setState({steps : steps});
    }

    render()
    {
        let currentStepComponent = this.state.steps[this.state.step].jsx;
        if(currentStepComponent === undefined){
            currentStepComponent = <InstallIntro />;
        }

        return(
        <div>
            <div className="wizardHeader">
                <div className="heading">
                    {translate("openstack.cloud.deployer.title")}
                </div>
                <WizardProgress steps={this.state.steps} currentStep={this.state.step} />
            </div>
            <div>
                {currentStepComponent}
            </div>
        </div>
        )
    }
}

export default InstallWizard;
