import React from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage.js';

import {
  PickerButton,
  ActionButton,
  ItemHelpButton
} from '../components/Buttons.js';

class CloudModelPicker extends BaseWizardPage {
  constructor(props) {
    super(props);

    this.templates = [];

    this.state = {
      selectedModelName: this.props.selectedModelName,
      selectedDetails: '',
      simpleModels: [ //add more items when user select it from complete templates
        'entry-scale-esx-kvm-vsa',
        'entry-scale-ironic-flat-network',
        'entry-scale-kvm-ceph',
        'entry-scale-swift',
        'mid-scale-kvm-vsa'
      ],
      pageValid: this.props.selectedModelName ? true : false
    };

    this.handlePickModel = this.handlePickModel.bind(this);
    this.handleSelectTemplate = this.handleSelectTemplate.bind(this);
    this.handleHelpChoose = this.handleHelpChoose.bind(this);
    this.handleShowSelectTemplateHelp = this.handleShowSelectTemplateHelp.bind(this);
    this.handleShowHelpChooseHelp = this.handleShowHelpChooseHelp.bind(this);
    this.updateParentSelectedModelName = this.updateParentSelectedModelName.bind(this);
  }

  componentWillMount() {
    this.getTemplates();
  }

  saveTemplateIntoModel(modelName) {
    fetch('http://localhost:8081/api/v1/clm/templates/' + modelName)
      .then(response => response.json())
      .then((responseData) => {
        // Save the selected template as the model
        fetch('http://localhost:8081/api/v1/clm/model', {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(responseData)
        })
          .then((response) => {
            if(response && response.ok === false) {
              //TODO remove when we have a toast error message
              console.log('Failed to save model object data');
              this.setState({
                pageValid: false
              });
            }
            else {
              //TODO remove
              console.log('Successfully saved model object data');
              this.setState({
                pageValid: true
              });
            }
          })
          .catch((error) => {
            //TODO remove when we have a toast error message
            console.log('Failed to save model object data');
            this.setState({
              pageValid: false
            });
          });
      })
      .catch((error) => {
        //TODO remove when we have a toast error message
        console.log('Failed to get model object data');
        this.setState({
          pageValid: false
        });
      });
  }

  getTemplates() {
    fetch('http://localhost:8081/api/v1/clm/templates')
      .then(response => response.json())
      .then((responseData) => {
        this.templates = responseData;

        //set default template selection if we have any
        if(this.state.selectedModelName) {
          let temp = this.findTemplate(this.state.selectedModelName);
          if (temp) {
            this.setState({selectedDetails: temp.overview});
          }
        }
      })
      .catch((error) => {
        //TODO remove
        console.log('Failed to get templates data');
      });
  }

  findTemplate(modelName) {
    let tplt = this.templates.find(function(template) {
      return template.name === modelName;
    });
    return tplt;
  }

  setSelectedDetails(modelName) {
    let temp = this.findTemplate(modelName);
    if(temp) {
      this.setState({selectedDetails: temp.overview});
    }
    else {
      //TODO remove
      console.log('Failed to find template for ' + modelName);
    }
  }

  updateParentSelectedModelName(modelName) {
    this.props.updateModelName(modelName);
  }

  isError() {
    //have model but have other errors
    return !this.state.pageValid && this.state.selectedModelName;
  }

  setNextButtonDisabled() {
    return !this.state.pageValid;
  }

  handlePickModel(e) {
    e.preventDefault();
    let modelName = e.target.getAttribute('name');
    this.setState({selectedModelName: modelName});
    this.setSelectedDetails(modelName);
    this.saveTemplateIntoModel(modelName);
    this.updateParentSelectedModelName(modelName);
  }

  handleSelectTemplate(e) {
    e.preventDefault();
    //TODO
  }

  handleHelpChoose(e) {
    e.preventDefault();
    //TODO
  }

  handleShowSelectTemplateHelp(e) {
    e.preventDefault();
    //TODO
  }

  handleShowHelpChooseHelp(e) {
    e.preventDefault();
    //TODO
  }

  renderPickerButtons() {
    let btns = [];
    for (let i = 0; i < this.state.simpleModels.length; i++) {
      let name = this.state.simpleModels[i];
      //TODO need better name to display
      let displayLabel = translate('model.picker.' + name);
      if(name === this.state.selectedModelName) {
        btns.push(
          <PickerButton
            key={i} keyName={name} isSelected
            displayLabel={displayLabel} clickAction={this.handlePickModel}/>
        );
      }
      else {
        btns.push(
          <PickerButton
            key={i} keyName={name}
            displayLabel={displayLabel} clickAction={this.handlePickModel}/>);
      }
    }
    return btns;
  }

  renderModelDetails(details) {
    return (
      <div className='model-details' dangerouslySetInnerHTML={{__html: details}}/>
    );
  }

  render() {
    let details = this.state.selectedDetails;
    return (
      <div className='wizardContentPage'>
        {this.renderHeading(translate('model.picker.heading'))}
        <div className='picker-container'>
          {this.renderPickerButtons()}
        </div>
        <div className='details-container'>
          {this.renderModelDetails(details)}
        </div>
        <div className='action-btn-container'>
          <div className='select-template'>
            <div className='select-template-heading'>
              {translate('model.picker.select-template-heading')}
              <ItemHelpButton clickAction={this.handleShowSelectTemplateHelp}/>
            </div>
            <ActionButton
              displayLabel={translate('model.picker.select-template')}
              clickAction={this.handleSelectTemplate}/>
          </div>
          <div className='help-choose'>
            <div className='help-choose-heading'>{translate('model.picker.help-choose-heading')}
              <ItemHelpButton clickAction={this.handleShowHelpChooseHelp}/>
            </div>
            <ActionButton
              displayLabel={translate('model.picker.help-choose')}
              clickAction={this.handleHelpChoose}/>
          </div>
        </div>
        {this.renderNavButtons()}
      </div>
    );
    //TODO need fix issue of order of next and back button
  }
}

export default CloudModelPicker;

