import React, { Component } from 'react';
import { translate } from '../../localization/localize.js';
import { ActionButton } from '../../components/Buttons.js';
import { alphabetically } from '../../utils/Sort.js';

class ServerGroupsTab extends Component {

  constructor(props) {
    super(props);
  }

  addServerGroup = (e) => {
    console.log('addServerGroup'); // eslint-disable-line no-console
  }
  editServerGroup = (e) => {
    console.log('editServerGroup'); // eslint-disable-line no-console
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

    return (
      <div>
        <div className='button-box'>
          <div>
            <ActionButton displayLabel={translate('add.server.group')} clickAction={(e) => this.addServerGroup(e)} />
          </div>
        </div>
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
          </tbody>
        </table>
      </div>
    );
  }
}

export default ServerGroupsTab;
