import React, { PropTypes } from 'react'
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage.js';
import { ActivePickerButton } from '../components/Buttons.js';

class CloudModelSummary extends BaseWizardPage {
  constructor(props) {
  super(props);
  this.state = {
    compute: undefined,
    controllers: undefined,
    monitoring: undefined,
    storage: undefined,
    activeItemType: undefined,
    activeItemAmount: undefined,
    customModel: false,
    description: undefined,
    editor: false
  }
  this.handleMouseEnter = this.handleMouseEnter.bind(this);
  this.handleClick = this.handleClick.bind(this);
  this.handleModelServerUpdate = this.handleModelServerUpdate.bind(this);

  }


//allows to dynamically update the information in the info panel based on the item hovered
  handleMouseEnter(e) {
    var serverType = e.target.id
    fetch('http://localhost:8080/modeldata')
    .then(response => response.json())
    .then(data => {
      this.setState({
        description: data[serverType]
      })
    })
  }


//on server type click will open an editor
  handleClick(e) {
    this.setState({
      editor: true,
      activeItemType: e.target.id,
      activeItemAmount: this.state[e.target.id]
    })
  }

//will update the state on field change
  handleModelServerUpdate = (e) => {
    this.setState({
      activeItemAmount: e.target.value,
      [this.state.activeItemType]: e.target.value
    })
  }

//will handle the update button and send the updates to a custom model in the backend
  handleModelServerUpdateSubmit = (e) => {
    e.preventDefault()
    this.setState({
      [this.state.activeItemType]: this.state.activeItemAmount,
      customModel: true
    })
    fetch('http://localhost:8080/customModels/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({[this.state.activeItemType]: this.state.activeItemAmount})
    })
    .then(response => response.json())
  }

  componentDidMount() {

//fetches initial model information depending on what ModelName was selected
    fetch('http://localhost:8080/'+ (this.state.customModel ? 'customModels/1' : 'models?name='+ this.props.selectedModelName))
      .then(response => response.json())
        .then(data => {
          this.setState({
            compute: data[0].compute,
            controllers: data[0].controllers,
            monitoring: data[0].monitoring,
            storage: data[0].storage
          })
        })
  }
  render () {
    return (
      <div className='model-picker-container'>
        <div className='col-xs-8 verticalLine'>
          <div className='row'>
            <h1 className='margin-top-10 margin-left-10 text-header'>Mandatory Components</h1>
          </div>
          <div className='row'>
            <ActivePickerButton id='controllers' value={this.state.controllers} description='Controller Nodes' handleMouseEnter={this.handleMouseEnter} handleClick={this.handleClick} />
            <ActivePickerButton id='compute' value={this.state.compute} description='Compute Nodes' handleMouseEnter={this.handleMouseEnter} handleClick={this.handleClick} />
            <ActivePickerButton id='monitoring' value={this.state.monitoring} description='Monitoring Nodes' handleMouseEnter={this.handleMouseEnter} handleClick={this.handleClick} />
          </div>
          <div className='row'>
            <h1 className='margin-top-80 margin-left-10 text-header'>Additional Components</h1>
          </div>
          <div className='row'>
            <ActivePickerButton id='storage' value={this.state.storage} description='Storage Nodes' handleMouseEnter={this.handleMouseEnter} handleClick={this.handleClick}/>
          </div>
        </div>
        <div className='col-xs-4'>
          <h2 className='text-header'>Info Panel</h2>
          <h4 className='text-header'>{this.state.description}</h4>
          <p />
          {this.state.editor
            ? <div className='margin-top-80'>
                <h2 className='text-header'>Edit number of machines</h2>
                <form className='form-inline col-xs-12 margin-top-20'>
                  <h4 className='text-theme'>You will update component: <span className='text-primary'>{this.state.activeItemType}</span></h4>
                  <div className='form-group'>
                      <input type='number' className='form-control' id='servers' value={this.state.activeItemAmount} onChange={this.handleModelServerUpdate} />
                  </div>
                  <button type='submit' className='btn btn-primary' onClick={this.handleModelServerUpdateSubmit}>Update</button>
                </form>
              </div>
          : <div />
          }
        </div>
        {this.renderNavButtons()}
      </div>
    )
  }
}

export default CloudModelSummary;
