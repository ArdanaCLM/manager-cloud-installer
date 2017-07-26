import React, { Component } from 'react';
import '../App.css';
import { translate } from '../localization/localize.js';

class InstallIntro extends Component {

    goForward(e){
        e.preventDefault();
        //typical pages would do some validation here before deciding to advance
        //however the intro page has no validation
        this.props.next();
    }

    render() {
        return (
            <div>
                {translate("welcome.cloud.install")}
                <button onClick={this.goForward.bind(this)}>
		  {translate("next")}
                </button>
            </div>
        );
    }
}

export default InstallIntro;
