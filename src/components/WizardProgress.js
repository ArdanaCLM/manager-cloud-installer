import React, { Component } from 'react';
//import '../App.css';
//import { translate } from './localization/localize.js';

class WizardProgress extends Component {
    render()
    {
	    var stateBubbles = this.props.steps.map(function(item,index){
		    console.log(item.keys);
		    console.log(item.state);
		    console.log(index);
		    if(item.state === 0){
		    	return (
			    <span key={index} className="progress notdone"/>
		    	);
		    } else {
			return (
			    <span key={index} className="progress done"/>
			);
		    }
	    });
	    return(
		<div>
		    {stateBubbles}
		    <hr/>
		    On step {this.props.currentStep}
	        </div>
	    )
    }
}

export default WizardProgress;
