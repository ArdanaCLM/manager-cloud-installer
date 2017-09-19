import React from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import BaseWizardPage from './BaseWizardPage.js';
import { ErrorMessage } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';
import {
  PickerButton, ActionButton, ItemHelpButton
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
      pageValid: this.props.selectedModelName ? true : false,
      showError: false,
      errorContent: undefined,
      loading: false
    };

    this.handlePickModel = this.handlePickModel.bind(this);
    this.handleSelectTemplate = this.handleSelectTemplate.bind(this);
    this.handleHelpChoose = this.handleHelpChoose.bind(this);
    this.handleShowSelectTemplateHelp = this.handleShowSelectTemplateHelp.bind(this);
    this.handleShowHelpChooseHelp = this.handleShowHelpChooseHelp.bind(this);
    this.handleCloseMessageAction = this.handleCloseMessageAction.bind(this);
  }

  componentWillMount() {
    this.getTemplates();
  }

  saveTemplateIntoModel(modelName) {
    this.setState({loading: true});
    fetch(getAppConfig('shimurl') + '/api/v1/clm/templates/' + modelName)
      .then((response) => this.checkResponse(response))
      .then((response) => response.json())
      .then((responseData) => {
        // Save the selected template as the model
        fetch(getAppConfig('shimurl') + '/api/v1/clm/model', {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(responseData)
        })
          .then((response) => this.checkResponse(response))
          .then((response) => this.setState({pageValid: true, loading: false}))
          .catch((error) => {
            let msg = translate('model.picker.save.model.error', modelName);
            let msgContent = {
              title: translate('model.picker.save.model.error.title'),
              messages: [msg, error.toString()]
            };
            this.setState({
              pageValid: false,
              showError: true,
              errorContent: msgContent,
              loading: false
            });
          });
      })
      .catch((error) => {
        let msg = translate('model.picker.get.model.error', modelName, error);
        let msgContent = {
          title: translate('model.picker.get.model.error.title'),
          messages: [msg, error.toString()]
        };
        this.setState({
          pageValid: false,
          showError: true,
          errorContent: msgContent,
          loading: false
        });
      });
  }

  checkResponse(response) {
    if (!response.ok) {
      throw Error(response.url + ':' + response.statusText);
    }
    return response;
  }

  getTemplates() {
    this.setState({loading: true});
    fetch(getAppConfig('shimurl') + '/api/v1/clm/templates')
      .then(response => this.checkResponse(response))
      .then(response => response.json())
      .then((responseData) => {
        this.templates = responseData;
        this.setState({loading: false});
        //set default template selection if we have any
        if(this.state.selectedModelName) {
          let temp = this.findTemplate(this.state.selectedModelName);
          if (temp) {
            this.setState({selectedDetails: temp.overview});
          }
        }
      })
      .catch((error) => {
        let msg = translate('model.picker.get.template.error');
        let msgContent = {
          title: translate('model.picker.get.template.error.title'),
          messages: [msg, error.toString()]
        };
        this.setState({
          showError: true,
          errorContent: msgContent,
          loading: false
        });
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
  }

  updateParentSelectedModelName = (modelName) => {
    this.props.updateGlobalState('selectedModelName', modelName);
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

  handleCloseMessageAction () {
    this.setState({showError: false});
  }

  renderLoadingMask() {
    return (
      <LoadingMask show={this.state.loading}></LoadingMask>
    );
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

  renderErrorMessage() {
    return (
      <ErrorMessage
        closeAction={this.handleCloseMessageAction}
        show={this.state.showError} content={this.state.errorContent}>
      </ErrorMessage>
    );
  }

  render() {
    let details = this.state.selectedDetails;
    return (
      <div className='wizard-content'>
        {this.renderHeading(translate('model.picker.heading'))}
        {this.renderLoadingMask()}
        <div className='picker-container'>
          {this.renderPickerButtons()}
        </div>
        <div className='details-container'>
          {this.renderModelDetails(details)}
        </div>
        <div className='action-btn-container'>
          <div className='action-btn-with-info'>
            <div className='info-heading'>
              {translate('model.picker.select-template-heading')}
              <ItemHelpButton clickAction={this.showSelectTemplateHelp}/>
            </div>
            <ActionButton
              displayLabel={translate('model.picker.select-template')}
              clickAction={this.handleSelectTemplate}/>
          </div>
          <div className='action-btn-with-info'>
            <div className='info-heading'>{translate('model.picker.help-choose-heading')}
              <ItemHelpButton clickAction={this.handleShowHelpChooseHelp}/>
            </div>
            <ActionButton
              displayLabel={translate('model.picker.help-choose')}
              clickAction={this.handleHelpChoose}/>
          </div>
        </div>
        {this.renderNavButtons()}
        {this.renderErrorMessage()}
      </div>
    );
    //TODO need fix issue of order of next and back button
  }
}

export default CloudModelPicker;

