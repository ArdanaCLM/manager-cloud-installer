import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';

class GenericPlaceHolder extends Component {

    goBack( e ){
        e.preventDefault();
        //if going back involved unsetting some parameters, do that here
        this.props.back();
    }

    goForward(e){
        e.preventDefault();
        //typical pages would do some validation here before deciding to advance
        //however the intro page has no validation
        this.props.next();
    }


    render() {
	let forward = null;
	if(this.props.next !== undefined){
                forward = <button onClick={this.goForward.bind(this)}>
		  {translate("next")}
                </button>
	}
        return (
            <div>
                {translate("generic.placeholder.heading")}
                <button onClick={this.goBack.bind(this)}>
		  {translate("back")}
                </button>
		{forward}
            </div>
        );
    }
}

export default GenericPlaceHolder;
