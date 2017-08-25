import React from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage.js';

import { ActionButton } from '../components/Buttons.js';
import { SearchBar, ServerList } from '../components/ServerUtils.js';

class DiscoverServers extends BaseWizardPage {
  constructor(props) {
    super(props);

    this.state = {
      availableServers: this.props.discoveredServers ? this.props.discoveredServers : [],
      searchFilterText: ''
    };

    this.handleDiscovery = this.handleDiscovery.bind(this);
    this.handleSearchText = this.handleSearchText.bind(this);
  }

  //handle filter text change
  handleSearchText(filterText) {
    this.setState({
      searchFilterText: filterText
    });
  }

  handleDiscovery() {
    this.getAvailableServersData()
      .then((rawServerData) => {
        if (rawServerData && rawServerData.length > 0) {
          let ids = rawServerData.map((srv) => {
            return srv.id;
          });

          this.getAllServerDetailsData(ids)
            .then((details) => {
              rawServerData = this.updateServerDataWithDetails(details);
              this.refreshServers(rawServerData);
              //save the servers and go to next page
              this.props.updateDiscoveredServers(this.state.availableServers);
            })
            .catch((error) => {
              //TODO remove
              console.error('Failed to get all servers details data');
            });
        }
      })
      .catch((error) => {
        //TODO remove
        console.error('Failed to get available data');
      });
  }

  refreshServers(rawServerData) {
    //TODO: merge the existing ones and discovered one
    this.setState({
      availableServers: rawServerData,
      searchFilterText: ''
    });
  }

  //suma
  updateServerDataWithDetails(details) {
    //details has everything
    let retData = details.map((srvDetail) => {
      let nkdevice = srvDetail.network_devices.find((device) => {
        return device.interface === 'eth0';
      });
      //at this point only these are useful
      let serverData = {
        'id': srvDetail.id + '', //make it a string instead of number
        'name': srvDetail.name,
        'ip-addr': nkdevice.ip,
        'mac-addr': nkdevice['hardware_address']
      };
      return serverData;
    });
    return retData;
  }

  getOneServerDetailData(url) {
    let promise = new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.json())
        .then((responseData) => {
          resolve(responseData);
        })
        .catch(error => {
          //TODO remove
          console.error('Failed to get one server details data');
        });
    });
    return promise;
  }

  //suma
  getAllServerDetailsData(serverIds) {
    let promises = [];
    serverIds.forEach((id) => {
      //TODO make it constant
      let url = 'http://localhost:8081/api/v1/sm/servers/' + id;
      promises.push(this.getOneServerDetailData(url));
    });

    return Promise.all(promises);
  }

  getAvailableServersData() {
    return (
      fetch('http://localhost:8081/api/v1/sm/servers')
        .then(response => response.json())
    );
  }

  render() {
    let filteredAvailableServers =
      this.state.availableServers.filter((server) => {
        return (server.name.indexOf(this.state.searchFilterText) !== -1);
      });

    return (
      <div className='wizard-content'>
        {this.renderHeading(translate('discover.server.heading'))}
        <div className='discover-server'>
          <div className='picker-container'></div>
          <div className='details-container'>
            <h4>{translate('assign.server.role.available-server')}</h4>
            <SearchBar
              filterText={this.state.searchFilterText}
              filterAction={this.handleSearchText}>
            </SearchBar>
            <div className="server-list-container rounded-box">
              <ServerList
                data={filteredAvailableServers}>
              </ServerList>
            </div>
          </div>
          <div>
            <ActionButton
              clickAction={this.handleDiscovery}
              displayLabel={translate('discover.server.discover')}/>
          </div>
        </div>
        {this.renderNavButtons()}
      </div>)
  }
}

export default DiscoverServers;

