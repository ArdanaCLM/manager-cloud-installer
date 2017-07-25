import React, { Component } from 'react';
import '../App.css';
import { translate } from '../localization/localize.js';

class CloudModelPicker extends Component {

    goBack( e ){
        e.preventDefault();
        //if going back involved unsetting some parameters, do that here
        this.props.back();
    }

    render() {
        return (
            <div>
                {translate("model.picker.heading")}
                <button onClick={this.goBack.bind(this)}>
                    Back
                </button>
            </div>
        );
    }
}

export default CloudModelPicker;