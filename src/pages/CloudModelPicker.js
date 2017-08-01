import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import GenericPlaceHolder from './GenericPlaceHolder';

class CloudModelPicker extends GenericPlaceHolder {

  render() {
    return (
      <div>
        {translate('model.picker.heading')}

        {this.renderNavButtons()}
      </div>
    );
  }
}

export default CloudModelPicker;
