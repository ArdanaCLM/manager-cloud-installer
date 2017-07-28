import React, { Component } from 'react';
import { stepStateValues } from './StepStateValues.js';
//import '../Deployer.css';
//import { translate } from './localization/localize.js';

class WizardProgress extends Component {
    render()
    {
        var stateBubbles = this.props.steps.map(function(item,index){
            if(item.state === stepStateValues.done){
                return (
                    <span key={index} className="progress done"/>
                );
            } else if(item.state === stepStateValues.inprogress){
                return (
                    <span key={index} className="progress inprogress"/>
                    );
            } else if(item.state === stepStateValues.error){
                return (
                    <span key={index} className="progress error"/>
                    );
            } else {
                return (
                    <span key={index} className="progress notdone"/>
                );
            }
        });
        return(
            <div className="stateOuterWrapper">
                <div className="stateLineWrapper">
                    <span>
                        {stateBubbles}
                    </span>
                </div>
            </div>
        )
    }
}

export default WizardProgress;
