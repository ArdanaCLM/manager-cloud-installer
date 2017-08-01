import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';

import {
    BackButton,
    NextButton,
    PickerButton,
    ActionButton,
    ItemHelpButton
} from '../components/Buttons.js';

class CloudModelPicker extends Component {
    constructor(props) {
        super(props);
        //TODO some states need to be coordinated with others
        this.state = {
            isNextButtonDisabled : false,
            selectedModelName: '', //TODO how to pass this out to the next page???
            selectedDetails: '',
            selectedModel: undefined, //TODO how to pass this out to the next page???
            simpleModels: [],
            templates: []
        };

        this.goBack = this.goBack.bind(this);
        this.goNext = this.goNext.bind(this);
        this.pickModel = this.pickModel.bind(this);
        this.selectTemplate = this.selectTemplate.bind(this);
        this.helpChoose = this.helpChoose.bind(this);
        this.showSelectTemplateHelp = this.showSelectTemplateHelp.bind(this);
        this.showHelpChooseHelp = this.showHelpChooseHelp.bind(this);
    }

    componentWillMount() {
        //TODO some of the data need to be passed in
        //will ajust next around
        this.state.selectedModelName = 'mid-scale-kvm-vsa';
        this.state.simpleModels = [
            'entry-scale-esx-kvm-vsa',
            'entry-scale-ironic-flat-network',
            'entry-scale-kvm-ceph',
            'entry-scale-swift',
            'mid-scale-kvm-vsa'
        ];
        this.getTemplates();
    }

    getModelObject(modelName) {
        //we only have midsize data
        fetch( "http://localhost:8080/" + "mid-scale-kvm-vsa")
            .then(response => response.json())
            .then((responseData) => {
                this.state.selectedModel = responseData;
            })
        //TODO handle error
    }

    getTemplates() {
        fetch( "http://localhost:8080/templates")
            .then(response => response.json())
            .then((responseData) => {
                this.state.templates = responseData;

                //set default template selection
                let mName = this.state.selectedModelName;
                let temp = this.findTemplate(mName);
                if(temp) {
                    this.setState({selectedDetails: temp.overview});
                }
                this.getModelObject(mName);
            })
        //TODO handle error
    }

    findTemplate(modelName) {
        let tplt = this.state.templates.find(function(template) {
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
            //TODO error
        }
    }

    goBack( e ){
        //if going back involved unsetting some parameters, do that here
        this.props.back();
    }

    goNext(e){
        //typical pages would do some validation here before deciding to advance
        //however the intro page has no validation
        this.props.next();
    }

    pickModel(e) {
        let modelName = e.target.getAttribute('name');
        this.setState({selectedModelName: modelName});
        this.setSelectedDetails(modelName);
        this.getModelObject(modelName);
    }

    selectTemplate(e) {
        //TODO
    }

    helpChoose(e) {
        //TODO
    }

    showSelectTemplateHelp(e) {
        //TODO
    }

    showHelpChooseHelp(e) {
        //TODO
    }

    renderPickerButtons() {
        let btns = [];
        for (let i = 0; i < this.state.simpleModels.length; i++) {
            let name = this.state.simpleModels[i];
            //TODO need better name to display
            let displayLabel = translate("model.picker." + name);
            if(name === this.state.selectedModelName){
                btns.push(<PickerButton key={i} keyName={name} isSelected
                                        displayLabel={displayLabel} clickAction={this.pickModel}/>);
            }
            else {
                btns.push(<PickerButton key={i} keyName={name}
                                        displayLabel={displayLabel} clickAction={this.pickModel}/>);
            }
        }
        return btns;
    }

    renderModelDetails(details) {
        return (
            <div className="model-details" dangerouslySetInnerHTML={{__html: details}}/>
        )
    }

    render() {
        let details = this.state.selectedDetails;
        return (
            <div className="model-picker-container">
                <div className="heading">{translate("model.picker.heading")}</div>
                <div className="picker-container">
                    {this.renderPickerButtons()}
                </div>
                <div className="details-container">
                    {this.renderModelDetails(details)}
                </div>
                <div className="action-btn-container">
                    <div className="select-template">
                        <div className="select-template-heading">
                            {translate("model.picker.select-template-heading")}
                            <ItemHelpButton clickAction={this.showSelectTemplateHelp}/>
                        </div>
                        <ActionButton displayLabel={translate("model.picker.select-template")}
                                      clickAction={this.selectTemplate}/>
                    </div>
                    <div className="help-choose">
                        <div className="help-choose-heading">{translate("model.picker.help-choose-heading")}
                            <ItemHelpButton clickAction={this.showHelpChooseHelp}/>
                        </div>
                        <ActionButton displayLabel={translate("model.picker.help-choose")}
                                      clickAction={this.helpChoose}/>
                    </div>
                </div>
                <div className="footer-container">
                    <NextButton isDisabled={this.state.isNextButtonDisabled}
                                clickAction={this.goNext}/>
                    <BackButton clickAction={this.goBack}/>
                </div>
            </div>
        );
        //TODO need fix issue of order of next and back button
    }
}

export default CloudModelPicker;