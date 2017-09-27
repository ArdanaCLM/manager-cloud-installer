import React, { PropTypes } from 'react'
import { fromJS } from 'immutable';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import BaseWizardPage from './BaseWizardPage.js';
import { ActivePickerButton } from '../components/Buttons.js';

class CloudModelSummary extends BaseWizardPage {
  constructor(props) {
    super(props);

    this.PATH_TO_CONTROL_PLANE = ['inputModel', 'control-planes', '0']

    this.state = {
      controlPlane: this.props.model.getIn(this.PATH_TO_CONTROL_PLANE),
                                // The control plane structure from the input model.
                                // Note: immutableJS is used so that we can keep track
                                // of the counts directly in the model, and manage state
                                // easily (by efficiently creating a new one whenever one
                                // of the counts change)

      activeItem: undefined     // The key path in the controlPlane structure, as a string.
                                // to the count value; for example, "resources.1.min-count"
    }
  }

  getDisplayName(role) {
    //TODO: Localize all of these strings
    var displayNames = {
      "CONTROLLER-ROLE": "Controller Nodes",
      "COMPUTE-ROLE": "Compute Nodes",
      "VSA-ROLE": "VSA Nodes",
      "RGW-ROLE": "RGW Nodes",
      "OSD-ROLE": "OSD Nodes",
      "MTRMON-ROLE": "Monitoring Nodes",
      "DBMQ-ROLE": "DB/MsgQ Nodes",
      "SWOBJ-ROLE": "Swift Nodes",
      "CORE-ROLE": "Core Nodes",
      "SWPAC-ROLE": "SWPAC Nodes",
      "NEUTRON-ROLE": "Neutron Nodes",
      "IRONIC-COMPUTE-ROLE": "Ironic Compute Nodes"
    };
    var NOT_FOUND = "Custom component type";

    return displayNames[role] || NOT_FOUND
  }

  getDescription() {
    if (! this.state.activeItem) {
      return '';
    }

    //TODO: Improve these descriptions
    //TODO: Localize all of these strings
    var descriptions = {
      "CONTROLLER-ROLE": "Controllers are an essential component of an OpenStack Cloud. We will deploy services such as Keystone, Horizon, Glance here.",
      "COMPUTE-ROLE": "Compute nodes is where your workload will eventually run. We will host services such as Nova on those machines. Make sure those machines have enough capacity.",
      "VSA-ROLE": "Describe VSA Nodes",
      "RGW-ROLE": "Describe RGW Nodes",
      "OSD-ROLE": "Describe OSD Nodes",
      "MTRMON-ROLE": "SUSE OpenStack Cloud is an enterprise class solution, this is why we ship monitoring capabilities with our system to allow for Day 2 operations out of the box.",
      "DBMQ-ROLE": "Describe DB/MsgQ Nodes",
      "SWOBJ-ROLE": "You can optionally add storage nodes to your deployment, and configure access to those nodes right from this panel.",
      "CORE-ROLE": "Describe Core Nodes",
      "SWPAC-ROLE": "Describe SWPAC Nodes",
      "NEUTRON-ROLE": "Describe Neutron Nodes",
      "IRONIC-COMPUTE-ROLE": "Describe Ironic Compute Nodes"
    };
    var NOT_FOUND = "Describe the fact that the customer must have created this role";
    var role = this.state.controlPlane.getIn(this.getKey(this.state.activeItem, 1)).get('server-role')
    return descriptions[role] || NOT_FOUND
  }

  // convert a delimited string (normally the state.activeItem) into a list.  Optionally
  // remove some number of trailing items from the list (to traverse higher in the structure)
  getKey(s, stripRight) {
    var key = s || this.state.activeItem;
    var toRemove = stripRight || 0;
    var list = key.split('.');
    return list.slice(0, list.length - toRemove);
  }

  // handle click on an item
  handleClick = (e) => {
    this.setState({activeItem: e.target.id});
  }

  //update the state on field change
  handleModelServerUpdate = (e) => {
    e.preventDefault();
    var newval = parseInt(e.target.value) || 0;
    if (newval < 0) {
      newval = 0;
    }
    this.setState((prevState, props) => {
        var old = prevState.controlPlane;
        return {controlPlane: old.updateIn(this.getKey(prevState.activeItem), val => newval)};
    });
  }

  setNextButtonDisabled() {
    // The control plane will be loaded in a promise when the component is mounted and
    // may not be available immediately.  Prevent the user from proceeding until it loads
    return !this.state.controlPlane;
  }

  //will handle the update button and send the updates to a custom model in the backend
  goForward(e) {
    e.preventDefault();

    // Update the control plane in the global model, save it, and move to the next page
    let model = this.props.model.updateIn(this.PATH_TO_CONTROL_PLANE, val => this.state.controlPlane);
    this.props.updateGlobalState('model', model, this.props.next);
  }

  renderItems = (section) => {

    // Only render items that have a count field
    var filtered = this.state.controlPlane.get(section).filter(item => {
      return item.has('member-count') || item.has('min-count')});

    return filtered.map((item, key) => {

      var count_type = item.has('member-count') ? 'member-count' : 'min-count';
      var value = item.get(count_type);

      // Build the id, which will be used as the activeItem
      var id = [section, key, count_type].join('.');
      var selected = (id === this.state.activeItem);

      return (
        <ActivePickerButton key={item.get('name')}
                            id={id}
                            value={value}
                            description={this.getDisplayName(item.get('server-role'))}
                            handleClick={this.handleClick}
                            isSelected={selected}/>
      );
    });
  }

  render () {
    var mandatoryItems = this.state.controlPlane ? this.renderItems("clusters") : [];
    var additionalItems = this.state.controlPlane ? this.renderItems("resources") : [];
    var number = this.state.activeItem ? this.state.controlPlane.getIn(this.getKey()) : 0;
    var additionalLabel = (additionalItems.size > 0) ?
      <div><h4>{translate('model.summary.additional')}</h4></div> : <div/>

    return (
      <div className='wizard-page'>
        <div className='wizard-content'>
          {this.renderHeading(translate('model.summary.heading', this.props.model.get('name')))}
          <div className='picker-container altwidth1'>
              <h4>{translate('model.summary.mandatory')}</h4>
              <div className='section'>
                {mandatoryItems}
              </div>
              {additionalLabel}
              <div className='section'>
                {additionalItems}
              </div>
          </div>
          <div className='details-container altwidth1'>
            {this.getDescription()}
            <p />
            {this.state.activeItem
              ? <div className='margin-top-80'>
                  <h4>{translate('model.summary.edit.machines')}</h4>
                  <form className='form-inline'>
                    <div className='form-group'>
                        <input type='number' className='form-control' id='servers' value={number} onChange={this.handleModelServerUpdate} />
                    </div>
                  </form>
                </div>
            : <div />
            }
          </div>
        </div>
        {this.renderNavButtons()}
      </div>
    )
  }
}

export default CloudModelSummary;
