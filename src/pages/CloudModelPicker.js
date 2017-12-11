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
import { fromJS } from 'immutable';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import { fetchJson } from '../utils/RestUtils.js';
import BaseWizardPage from './BaseWizardPage.js';
import { ErrorMessage } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';
import { PickerButton } from '../components/Buttons.js';
import Dropdown from '../components/Dropdown.js';

const NODE_COUNT_THRESHOLD = 30;
const NODE_COUNT_OPT1 = '1';
const NODE_COUNT_OPT2 = '2';

class CloudModelPicker extends BaseWizardPage {

  constructor(props) {
    super(props);

    this.templates = [];

    this.state = {
      // Capture the name of the selected model
      selectedModelName: this.props.model.get('name'),

      errorContent: undefined,
      loading: false,

      // filters
      filterNodeCount: 'none',
      filterHypervisorType: 'none',
      filterStorageType: 'none',
      filterNetworkType: 'none'
    };

    this.saveRequired = false;
  }

  componentWillMount() {
    this.setState({loading: true});

    // Load overview for all templates
    fetchJson('/api/v1/clm/templates')
      .then((templates) => {
        this.templates = templates;
        this.setState({loading: false});
      })
      .catch((error) => {
        this.setState({
          errorContent: {
            title: translate('model.picker.get.template.error.title'),
            messages: [
              translate('model.picker.get.template.error'),
              error.toString()]
          },
          loading: false
        });
      });
  }

  handlePickModel = (e) => {
    this.setState({selectedModelName: e.target.getAttribute('name')});
    this.saveRequired = true;
  }

  goForward = (e) => {
    e.preventDefault();

    if(this.saveRequired) {
      this.setState({loading: true});
      // Load the full template, update the global model, and save it
      fetchJson('/api/v1/clm/templates/' + this.state.selectedModelName)
        .then(model => this.props.updateGlobalState('model', fromJS(model), this.props.next))
        .catch(error => {
          this.setState({
            errorContent: {
              title: translate('model.picker.save.model.error.title'),
              messages: [
                translate('model.picker.save.model.error', this.state.selectedModelName),
                error.toString()]
            },
            loading: false
          });
        });
      this.saveRequired = false;
    } else {
      this.props.next();
    }
  }

  setNextButtonDisabled() {
    return ! this.state.selectedModelName;
  }

  renderLoadingMask() {
    return (
      <LoadingMask show={this.state.loading}></LoadingMask>
    );
  }

  renderErrorMessage() {
    if (this.state.errorContent) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage
            closeAction={() => this.setState({errorContent: undefined})}
            title={this.state.errorContent.title}
            message={this.state.errorContent.messages}>
          </ErrorMessage>
        </div>
      );
    }
  }

  getFilterValue = (filterName) => {
    if (filterName === 'node-count') {
      return this.state.filterNodeCount;
    } else if (filterName === 'hypervisor-type') {
      return this.state.filterHypervisorType;
    } else if (filterName === 'storage-type') {
      return this.state.filterStorageType;
    } else if (filterName === 'network-type') {
      return this.state.filterNetworkType;
    }
  }

  handleFilter = (filterName, value) => {
    if (filterName === 'node-count') {
      this.setState({filterNodeCount: value});
    } else if (filterName === 'hypervisor-type') {
      this.setState({filterHypervisorType: value});
    } else if (filterName === 'storage-type') {
      this.setState({filterStorageType: value});
    } else if (filterName === 'network-type') {
      this.setState({filterNetworkType: value});
    }
  }

  checkNodeCounts = (templateNodeCount) => {
    const ncAlt = templateNodeCount > NODE_COUNT_THRESHOLD ? NODE_COUNT_OPT2 : NODE_COUNT_OPT1;
    return ncAlt === this.state.filterNodeCount;
  }

  filterTemplates = () => {
    return this.templates.filter((template) => {
      return (this.state.filterNodeCount === 'none' ||
          this.checkNodeCounts(template.metadata.nodeCount)) &&
        (this.state.filterHypervisorType === 'none' ||
          template.metadata.hypervisor.includes(this.state.filterHypervisorType)) &&
        (this.state.filterStorageType === 'none' ||
          template.metadata.storage === this.state.filterStorageType) &&
        (this.state.filterNetworkType === 'none' ||
          template.metadata.network === this.state.filterNetworkType);
    });
  }

  // util to find unique values from array of arrays
  getUniqueValues(inputArray) {
    let uniques = [];
    inputArray.forEach((input) => {
      input.forEach((inp) => {
        if (!uniques.includes(inp)) {
          uniques.push(inp);
        }
      });
    });
    return uniques;
  }

  processFilters = (templates) => {
    // 'newFilters' keeps track of ALL filter options which changes every time the user makes a new
    // selection by looking at metadata of all templates and sorting out the available values by
    // filter type then displaying those values as filter options
    let newFilters = [];

    const nodeCounts = templates.map((template) => {
      return template.metadata.nodeCount > NODE_COUNT_THRESHOLD ? NODE_COUNT_OPT2 : NODE_COUNT_OPT1;
    });
    const uniqueNodeCounts = [...new Set(nodeCounts)].sort((a, b) => {return a-b;});
    const ncOptions = uniqueNodeCounts.length > 0 ? ['none'].concat(uniqueNodeCounts) : ['none'];
    const nodeCountFilter = {name: 'node-count', options: ncOptions};
    newFilters.push(nodeCountFilter);

    const hypervisors = templates.map((template) => {return template.metadata.hypervisor;});
    const uniqueHypervisors = this.getUniqueValues(hypervisors).sort();
    const hOptions = uniqueHypervisors.length > 0 ? ['none'].concat(uniqueHypervisors) : ['none'];
    const hypervisorFilter = {name: 'hypervisor-type', options: hOptions};
    newFilters.push(hypervisorFilter);

    let storages = templates.map((template) => {return template.metadata.storage;});
    storages = storages.filter((storage) => {return storage !== undefined;});
    const uniqueStorages = [...new Set(storages)].sort();
    const sOptions = uniqueStorages.length > 0 ? ['none'].concat(uniqueStorages) : ['none'];
    const storageFilter = {name: 'storage-type', options: sOptions};
    newFilters.push(storageFilter);

    let networks = templates.map((template) => {return template.metadata.network;});
    networks = networks.filter((network) => {return network !== undefined;});
    const uniqueNetworks = [...new Set(networks)].sort();
    const nOptions = uniqueNetworks.length ? ['none'].concat(uniqueNetworks) : ['none'];
    const networkFilter = {name: 'network-type', options: nOptions};
    newFilters.push(networkFilter);

    return newFilters;
  }

  renderFilterBar = (templates) => {
    const filters = this.processFilters(templates);
    const filterDropdowns = filters.map((filter) => {
      const options = filter.options.map((option) => {
        const displayText = option === 'none' ? translate('model.picker.filter.' + filter.name) :
          translate('model.picker.filter.' + filter.name + '.option.' + option);
        return (
          <option key={filter.name + option} value={option} className=''>{displayText}</option>
        );
      });

      return (
        <div key={filter.name} className='filter-box'>
          <Dropdown
            value={this.getFilterValue(filter.name)}
            onChange={(e) => this.handleFilter(filter.name, e.target.value)}>
            {options}
          </Dropdown>
        </div>
      );
    });

    return (
      <div className='filter-bar-container'>
        <h4 className='filter-line-header'>{translate('model.picker.filter.line.header')}</h4>
        {filterDropdowns}
      </div>
    );
  }

  render() {
    const filteredTemplates = this.filterTemplates();
    const selectedTemplate = filteredTemplates.find((template) => {
      return template.name === this.state.selectedModelName;});

    // details is the html help content read from model template fetched from the backend server.
    // It should be safe to be rendered as the raw html content in the details view.
    let details = selectedTemplate ? selectedTemplate.overview : '';
    const btns = filteredTemplates.map((template, idx) =>
      <PickerButton
        key={idx}
        keyName={template.name}
        isSelected={template.name === this.state.selectedModelName}
        displayLabel={translate('model.picker.' + template.name)}
        clickAction={this.handlePickModel}/>);

    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('model.picker.heading'))}
        </div>
        <div className='wizard-content'>
          {this.renderLoadingMask()}
          {this.renderFilterBar(filteredTemplates)}
          <div className='picker-container'>
            {btns}
          </div>
          <div className='details-container'>
            <div className='model-details' dangerouslySetInnerHTML={{__html: details}}/>
          </div>
          {this.renderErrorMessage()}
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default CloudModelPicker;
