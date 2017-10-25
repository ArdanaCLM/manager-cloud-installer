import React, { Component } from 'react';
import { translate } from '../../localization/localize.js';
import { ActionButton } from '../../components/Buttons.js';
import { alphabetically } from '../../utils/Sort.js';

class NicMappingTab extends Component {

  constructor(props) {
    super(props);
  }

  addNicMapping = (e) => {
    console.log('addNicMapping'); // eslint-disable-line no-console
  }
  editNicMapping = (e) => {
    console.log('editNicMapping'); // eslint-disable-line no-console
  }

  render() {
    const rows = this.props.model.getIn(['inputModel','nic-mappings'])
      .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
      .map((m,idx) => {
        const numPorts = m.get('physical-ports').size;
        return (
          <tr key={idx}>
            <td>{m.get('name')}</td>
            <td>{numPorts}</td>
            <td><span onClick={(e) => this.editNicMapping(e)} className='glyphicon glyphicon-pencil edit'></span></td>
          </tr>);
      });

    return (
      <div>
        <div className='button-box'>
          <div>
            <ActionButton displayLabel={translate('add.nic.mapping')} clickAction={(e) => this.addNicMapping(e)} />
          </div>
        </div>
        <table className='table'>
          <thead>
            <tr>
              <th>{translate('nic.mapping.name')}</th>
              <th>{translate('number.ports')}</th>
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

export default NicMappingTab;
