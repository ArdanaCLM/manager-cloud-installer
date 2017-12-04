// (c) Copyright 2017 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
import React from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage.js';
import { ActivePickerButton } from '../components/Buttons.js';

class CloudModelSummary extends BaseWizardPage {
  constructor(props) {
    super(props);

    this.PATH_TO_CONTROL_PLANE = ['inputModel', 'control-planes', '0'];

    this.state = {
      controlPlane: this.props.model.getIn(this.PATH_TO_CONTROL_PLANE),
      // The control plane structure from the input model.
      // Note: immutableJS is used so that we can keep track
      // of the counts directly in the model, and manage state
      // easily (by efficiently creating a new one whenever one
      // of the counts change)

      activeItem: undefined
      // The key path in the controlPlane structure, as a string.
      // to the count value; for example, "resources.1.min-count"
    };
  }

  getDisplayName(role) {
    //TODO: Localize all of these strings
    var displayNames = {
      'CONTROLLER-ROLE': translate('model.summary.role.displayname.CONTROLLER-ROLE'),
      'COMPUTE-ROLE': translate('model.summary.role.displayname.COMPUTE-ROLE'),
      'VSA-ROLE': translate('model.summary.role.displayname.VSA-ROLE'),
      'RGW-ROLE': translate('model.summary.role.displayname.RGW-ROLE'),
      'OSD-ROLE': translate('model.summary.role.displayname.OSD-ROLE'),
      'MTRMON-ROLE': translate('model.summary.role.displayname.MTRMON-ROLE'),
      'DBMQ-ROLE': translate('model.summary.role.displayname.DBMQ-ROLE'),
      'SWOBJ-ROLE': translate('model.summary.role.displayname.SWOBJ-ROLE'),
      'CORE-ROLE': translate('model.summary.role.displayname.CORE-ROLE'),
      'SWPAC-ROLE': translate('model.summary.role.displayname.SWPAC-ROLE'),
      'NEUTRON-ROLE': translate('model.summary.role.displayname.NEUTRON-ROLE'),
      'IRONIC-COMPUTE-ROLE': translate('model.summary.role.displayname.IRONIC-COMPUTE-ROLE')
    };
    var NOT_FOUND = 'Custom component type';

    return displayNames[role] || NOT_FOUND;
  }

  getDescription() {
    if (! this.state.activeItem) {
      return '';
    }

    //TODO: Improve these descriptions
    //TODO: Localize all of these strings
    var descriptions = {
      'CONTROLLER-ROLE': translate('model.summary.role.description.CONTROLLER-ROLE'),
      'COMPUTE-ROLE': translate('model.summary.role.description.COMPUTE-ROLE'),
      'VSA-ROLE': translate('model.summary.role.description.VSA-ROLE'),
      'RGW-ROLE': translate('model.summary.role.description.RGW-ROLE'),
      'OSD-ROLE': translate('model.summary.role.description.OSD-ROLE'),
      'MTRMON-ROLE': translate('model.summary.role.description.MTRMON-ROLE'),
      'DBMQ-ROLE': translate('model.summary.role.description.DBMQ-ROLE'),
      'SWOBJ-ROLE': translate('model.summary.role.description.SWOBJ-ROLE'),
      'CORE-ROLE': translate('model.summary.role.description.CORE-ROLE'),
      'SWPAC-ROLE': translate('model.summary.role.description.SWPAC-ROLE'),
      'NEUTRON-ROLE': translate('model.summary.role.description.NEUTRON-ROLE'),
      'IRONIC-COMPUTE-ROLE': translate('model.summary.role.description.IRONIC-COMPUTE-ROLE')
    };
    var NOT_FOUND = translate('model.summary.role.description.NOT_FOUND');
    var role = this.state.controlPlane.getIn(this.getKey(this.state.activeItem, 1)).get('server-role');
    return descriptions[role] || NOT_FOUND;
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
      return item.has('member-count') || item.has('min-count');});

    return filtered.map((item, key) => {

      var count_type = item.has('member-count') ? 'member-count' : 'min-count';
      var value = count_type === 'min-count' ? '>= ' + item.get(count_type) : item.get(count_type);

      // Build the id, which will be used as the activeItem
      var id = [section, key, count_type].join('.');
      var selected = (id === this.state.activeItem);

      return (
        <ActivePickerButton
          key={item.get('name')}
          id={id}
          value={value}
          description={this.getDisplayName(item.get('server-role'))}
          handleClick={this.handleClick}
          isSelected={selected}/>
      );
    });
  }

  render () {
    var mandatoryItems = this.state.controlPlane ? this.renderItems('clusters') : [];
    var additionalItems = this.state.controlPlane ? this.renderItems('resources') : [];
    var number = this.state.activeItem ? this.state.controlPlane.getIn(this.getKey()) : 0;
    let editNodesLabel = translate('model.summary.edit.nodes');
    if (this.state.activeItem && this.state.activeItem.indexOf('min-count') !== -1) {
      editNodesLabel = translate('model.summary.edit.min.nodes');
    }
    var additionalLabel = (additionalItems.size > 0) ?
      <div><h4>{translate('model.summary.additional')}</h4></div> : <div/>;

    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('model.summary.heading', this.props.model.get('name')))}
        </div>
        <div className='wizard-content'>
          <div className='picker-container'>
            <h4>{translate('model.summary.mandatory')}</h4>
            <div className='section'>
              {mandatoryItems}
            </div>
            {additionalLabel}
            <div className='section'>
              {additionalItems}
            </div>
          </div>
          <div className='details-container'>
            {this.getDescription()}
            <p />
            {this.state.activeItem
              ? <div className='margin-top-80'>
                <h4>{editNodesLabel}</h4>
                <form className='form-inline'>
                  <div className='form-group'>
                    <input type='number'
                      className='form-control'
                      id='servers'
                      value={number}
                      onChange={this.handleModelServerUpdate} />
                  </div>
                </form>
              </div>
              : <div />
            }
          </div>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default CloudModelSummary;
