import React, { Component } from 'react';
import { translate } from '../../localization/localize.js';
import { ActionButton } from '../../components/Buttons.js';
import { alphabetically } from '../../utils/Sort.js';
import ServerGroupDetails from './ServerGroupDetails.js';

class ServerGroupsTab extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showServerGroupDetails: true
    }
  }

  addServerGroup = (e) => {
    console.log('addServerGroup');
    this.setState({showServerGroupDetails: true});
  }
  editServerGroup = (e) => {
    console.log('editServerGroup');
  }

  hideServerGroupDetails = () => {
    console.log('hidServerGroupDetails');
    this.setState({showServerGroupDetails: false});
  }

  render() {
    const rows = this.props.model.getIn(['inputModel','server-groups'])
      .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
      .map((m,idx) => {
        let numNetworks = '-';
        if (m.has('networks')) {
          numNetworks = m.get('networks').size;
        }

        let numServerGroups = '-';
        if (m.has('server-groups')) {
          numServerGroups = m.get('server-groups').size;
        }

        return (
          <tr key={idx}>
            <td>{m.get('name')}</td>
            <td>{numNetworks}</td>
            <td>{numServerGroups}</td>
            <td><span onClick={(e) => this.editServerGroup(e)} className='glyphicon glyphicon-pencil edit'></span></td>
          </tr>);
      });

    let actionRow = (
      <tr key='serverGroupAction' className='action-row'>
        <td><i className='material-icons add-button' onClick={(e) => this.addServerGroup(e)}>
          add_circle</i>{translate('add.server.group')}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    );

    let detailsSection = (
      <div className='details-section'>
        <div className='no-options'>{translate('no.options.available')}</div>
      </div>);
    if (this.state.showServerGroupDetails) {
      detailsSection = (<ServerGroupDetails model={this.props.model}
        updateGlobalState={this.props.updateGlobalState}
        closeAction={this.hideServerGroupDetails}/>);
    }

    return (
      <div>
        <div className='col-xs-8 verticalLine'>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('server.group.name')}</th>
                <th>{translate('number.networks')}</th>
                <th>{translate('number.server.groups')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows}
              {actionRow}
            </tbody>
          </table>
        </div>
        <div className='col-xs-4'>
          {detailsSection}
        </div>
      </div>
    );
  }
}

export default ServerGroupsTab;
