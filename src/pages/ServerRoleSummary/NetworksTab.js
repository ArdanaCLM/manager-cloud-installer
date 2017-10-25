import React, { Component } from 'react';
import { translate } from '../../localization/localize.js';
import { ActionButton } from '../../components/Buttons.js';
import { alphabetically } from '../../utils/Sort.js';

class NetworksTab extends Component {

  constructor(props) {
    super(props);
  }

  addNetwork = (e) => {
    console.log('addNetwork'); // eslint-disable-line no-console
  }
  editNetwork = (e) => {
    console.log('editNetwork'); // eslint-disable-line no-console
  }

  render() {
    const trueStr = translate('true');
    const falseStr = translate('false');

    const rows = this.props.model.getIn(['inputModel','networks'])
      .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
      .map((m,idx) => {
        return (
          <tr key={idx}>
            <td>{m.get('name')}</td>
            <td>{m.get('vlanid')}</td>
            <td>{m.get('cidr')}</td>
            <td>{m.get('gateway-ip')}</td>
            <td>{m.get('tagged-vlan') ? trueStr : falseStr}</td>
            <td><span onClick={(e) => this.editNetwork(e)} className='glyphicon glyphicon-pencil edit'></span></td>
          </tr>);
      });

    return (
      <div>
        <div className='button-box'>
          <div>
            <ActionButton displayLabel={translate('add.network')} clickAction={(e) => this.addNetwork(e)} />
          </div>
        </div>
        <table className='table'>
          <thead>
            <tr>
              <th>{translate('network')}</th>
              <th>{translate('vlanid')}</th>
              <th>{translate('cidr')}</th>
              <th>{translate('gateway')}</th>
              <th>{translate('tagged.vlan')}</th>
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

export default NetworksTab;
