import React from 'react';
import { fromJS } from 'immutable';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import { fetchJson, postJson } from '../utils/RestUtils.js';
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
    this.simpleModels = [ //add more items when user select it from complete templates
      'entry-scale-esx-kvm-vsa',
      'entry-scale-ironic-flat-network',
      'entry-scale-kvm-ceph',
      'entry-scale-swift',
      'mid-scale-kvm-vsa'
    ];

    this.state = {
      // Capture the name of the selected model
      selectedModelName: this.props.model.get('name'),

      errorContent: undefined,
      loading: false
    };
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
    this.setState({selectedModelName: e.target.getAttribute('name')})
  }

  goForward = (e) => {
    e.preventDefault();

    this.setState({loading: true});
    // Load the full template, update the global model, and save it
    fetchJson('/api/v1/clm/templates/' + this.state.selectedModelName)
      .then(model => {
        this.props.updateGlobalState('model', fromJS(model));
        return this.props.saveModel()})
      .then(() => this.props.next())  // go to the next page
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
  }

  handleSelectTemplate = (e) => {
    e.preventDefault();
    //TODO
  }

  handleHelpChoose = (e) => {
    e.preventDefault();
    //TODO
  }

  handleShowSelectTemplateHelp = (e) => {
    e.preventDefault();
    //TODO
  }

  handleShowHelpChooseHelp = (e) => {
    e.preventDefault();
    //TODO
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
        <ErrorMessage
          closeAction={() => this.setState({errorContent: undefined})}
          title={this.state.errorContent.title}
          message={this.state.errorContent.messages}>
        </ErrorMessage>
      );
    }
  }

  render() {
    let details = '';
    const template = this.templates.find(template => template.name === this.state.selectedModelName);
    if(template) {
      details = template['overview'];
    }

    const btns = this.simpleModels.map((name,idx) =>
        <PickerButton
          key={idx}
          keyName={name}
          isSelected={name === this.state.selectedModelName}
          displayLabel={translate('model.picker.' + name)}
          clickAction={this.handlePickModel}/>);

    return (
      <div className='wizard-page'>
        <div className='wizard-content'>
          {this.renderHeading(translate('model.picker.heading'))}
          {this.renderLoadingMask()}
          <div className='picker-container'>
            {btns}
          </div>
          <div className='details-container'>
            <div className='model-details' dangerouslySetInnerHTML={{__html: details}}/>
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
          {this.renderErrorMessage()}
          </div>
        {this.renderNavButtons()}
      </div>
    );
    //TODO need fix issue of order of next and back button
  }
}

export default CloudModelPicker;
