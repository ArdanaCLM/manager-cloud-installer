import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import { ActionButton } from './Buttons.js';
import SmServerDetails from './SmServerDetails.js';
import OvServerDetails from './OvServerDetails.js';
import ModelServerDetails from './ModelServerDetails.js';

class ViewServerDetails extends Component {
  constructor(props) {
    super(props);
    this.className = 'view-server-details ';
  }

  handleClose = () => {
    this.props.cancelAction();
  }

  renderDetailsContent() {
    if(this.props.tableId && this.props.source === 'sm') {
      return (<SmServerDetails data={this.props.data} {...this.props}/>);
    }
    else if(this.props.tableId && this.props.source === 'ov') {
      return (<OvServerDetails data={this.props.data} {...this.props}/>);
    }
    else { //for manual added items or no source item
      this.className = this.className + 'shorter-height';
      return (<ModelServerDetails data={this.props.data}/>);
    }
  }

  renderFooter() {
    return (
      <div className='btn-row button-container'>
        <ActionButton
          clickAction={this.handleClose} displayLabel={translate('common.close')}/>
      </div>
    );
  }

  render() {
    return (
      <div className={this.className}>
        {this.renderDetailsContent()}
        {this.renderFooter()}
      </div>
    );
  }
}

export default ViewServerDetails;
