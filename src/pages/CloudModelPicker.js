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
      filterNetworkType: 'none',
      currentFilter: 'none'
    };

    this.saveRequired = false;
    this.filteredTemplates = [];
    this.displayTemplates = [];
    this.selectedFilters = [];
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

  componentDidUpdate(prevProps, prevState) {
    // clear model selection if the filtered templates do not contain the selected model
    if (prevState.selectedModelName) {
      const selectedModel = this.displayTemplates.find((template) => {
        return template.name === prevState.selectedModelName;});
      if (this.displayTemplates.length > 0 && selectedModel === undefined) {
        this.setState((prevState) => {return {selectedModelName: undefined};});
      }
    }
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
    const index = this.selectedFilters.indexOf(filterName);
    if (value === 'none') {
      if (index !== -1) {
        this.selectedFilters.splice(index, 1);
        if (this.selectedFilters.length >= 1) {
          this.setState({currentFilter: this.selectedFilters[this.selectedFilters.length - 1]});
        } else {
          this.setState({currentFilter: value});
        }
      }
    } else {
      if (index === -1) {
        this.selectedFilters.push(filterName);
        this.setState({currentFilter: filterName});
      }
    }

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

  getDisplayTemplates = () => {
    // filteredTemplates is a list of templates after all filters have been applied except the
    // current filter, thus allows displaying of templates by options of the current filter
    this.filteredTemplates = JSON.parse(JSON.stringify(this.templates));
    if (this.selectedFilters.length > 1) {
      const appliedFilters = this.selectedFilters.filter(filter => filter !== this.state.currentFilter);
      for (let i=0; i<appliedFilters.length; i++) {
        const appliedFilter = appliedFilters[i];
        if (appliedFilter === 'node-count') {
          this.filteredTemplates = this.filteredTemplates.filter((template) => {
            return this.checkNodeCounts(template.metadata.nodeCount);
          });
        }
        if (appliedFilter === 'hypervisor-type') {
          this.filteredTemplates = this.filteredTemplates.filter((template) => {
            return template.metadata.hypervisor.includes(this.state.filterHypervisorType);
          });
        }
        if (appliedFilter === 'storage-type') {
          this.filteredTemplates = this.filteredTemplates.filter((template) => {
            return template.metadata.storage === this.state.filterStorageType;
          });
        }
        if (appliedFilter === 'network-type') {
          this.filteredTemplates = this.filteredTemplates.filter((template) => {
            return template.metadata.network === this.state.filterNetworkType;
          });
        }
      }
    }

    // apply currentFilter to filteredTemplates
    if (this.selectedFilters.length > 0 && this.state.currentFilter !== 'none') {
      return this.filteredTemplates.filter((template) => {
        if (this.state.currentFilter === 'node-count') {
          return this.state.filterNodeCount === 'none' ||
            this.checkNodeCounts(template.metadata.nodeCount);
        }
        if (this.state.currentFilter === 'hypervisor-type') {
          return this.state.filterHypervisorType === 'none' ||
            template.metadata.hypervisor.includes(this.state.filterHypervisorType);
        }
        if (this.state.currentFilter === 'storage-type') {
          return this.state.filterStorageType === 'none' ||
            template.metadata.storage === this.state.filterStorageType;
        }
        if (this.state.currentFilter === 'network-type') {
          return this.state.filterNetworkType === 'none' ||
            template.metadata.network === this.state.filterNetworkType;
        }
      });
    } else {
      return this.filteredTemplates;
    }
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
    // 'newFilters' calculates options for each filter, which changes every time the user makes a
    // new selection, by looking at template metadata and sorting out the metadata by filter type
    // then displaying those values as filter options
    let newFilters = [];

    const ncSource = this.state.currentFilter === 'node-count' ? this.filteredTemplates : templates;
    const nodeCounts = ncSource.map((template) => {
      // if no metadata or nodeCount, disregard data by setting nodeCount to 0 then filter it out
      return (template.metadata && template.metadata.nodeCount) ?
        (template.metadata.nodeCount > NODE_COUNT_THRESHOLD) ? NODE_COUNT_OPT2 : NODE_COUNT_OPT1 : 0;
    }).filter(nodeCount => nodeCount > 0);
    const uniqueNodeCounts = [...new Set(nodeCounts)].sort((a, b) => {return a-b;});
    const ncOptions = uniqueNodeCounts.length > 0 ? ['none'].concat(uniqueNodeCounts) : ['none'];
    const nodeCountFilter = {name: 'node-count', options: ncOptions};
    newFilters.push(nodeCountFilter);

    const hSource = this.state.currentFilter === 'hypervisor-type' ? this.filteredTemplates : templates;
    const hypervisors = hSource.map((template) => {
      return (template.metadata && template.metadata.hypervisor) ? template.metadata.hypervisor : [];
    });
    const uniqueHypervisors = this.getUniqueValues(hypervisors).sort();
    const hOptions = uniqueHypervisors.length > 0 ? ['none'].concat(uniqueHypervisors) : ['none'];
    const hypervisorFilter = {name: 'hypervisor-type', options: hOptions};
    newFilters.push(hypervisorFilter);

    const sSource = this.state.currentFilter === 'storage-type' ? this.filteredTemplates : templates;
    let storages = sSource.map((template) => {
      return (template.metadata && template.metadata.storage) ? template.metadata.storage : undefined;
    }).filter(storage => storage !== undefined);
    const uniqueStorages = [...new Set(storages)].sort();
    const sOptions = uniqueStorages.length > 0 ? ['none'].concat(uniqueStorages) : ['none'];
    const storageFilter = {name: 'storage-type', options: sOptions};
    newFilters.push(storageFilter);

    const nSource = this.state.currentFilter === 'network-type' ? this.filteredTemplates : templates;
    let networks = nSource.map((template) => {
      return (template.metadata && template.metadata.network) ? template.metadata.network : undefined;
    }).filter(network => network !== undefined);
    const uniqueNetworks = [...new Set(networks)].sort();
    const nOptions = uniqueNetworks.length ? ['none'].concat(uniqueNetworks) : ['none'];
    const networkFilter = {name: 'network-type', options: nOptions};
    newFilters.push(networkFilter);

    return newFilters;
  }

  checkShowFilterBar(filters) {
    const availableOptions = filters.filter(filter => filter.options.length > 1);
    return availableOptions.length > 0;
  }

  renderFilterBar = (templates) => {
    const filters = this.processFilters(templates);
    if (this.checkShowFilterBar(filters)) {
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
  }

  render() {
    this.displayTemplates = this.getDisplayTemplates();
    const selectedTemplate = this.displayTemplates.find((template) => {
      return template.name === this.state.selectedModelName;});

    // details is the html help content read from model template fetched from the backend server.
    // It should be safe to be rendered as the raw html content in the details view.
    let details = selectedTemplate ? selectedTemplate.overview : '';
    const btns = this.displayTemplates.map((template, idx) =>
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
          {this.renderFilterBar(this.displayTemplates)}
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
