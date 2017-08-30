import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import { getAppConfig } from '../components/ConfigHelper.js';
import io from 'socket.io-client';

class LogViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contents: ''
    };

    fetch(getAppConfig('shimurl') + '/api/v1/clm/plays/' + props.playId, {
      // Note: Avoid using cached values to get an up-to-date response
      headers: {
        'pragma': 'no-cache',
        'cache-control': 'no-cache'
      }
    })
    .then(response => {
      if (! response.ok) {
        throw (response.statusText);
      } else {
        return response.json();
      }})
    .then(response => {
      if ('endTime' in response) {
        fetch(getAppConfig('shimurl') + '/api/v1/clm/plays/' + props.playId + "/log")
        .then(response => response.text())
        .then(response => this.setState({contents: response}))

      } else {
        this.socket = io(getAppConfig('deployserviceurl'));

        this.socket.on('connect', data => {
          this.socket.emit('join', response['id']);
        });

        this.socket.on('log', data => {
          this.setState((prevState, props) => {
            return ({contents: prevState['contents']+data });
          });
        });

        this.socket.on('end', data => {
          this.socket.disconnect();
        });
      }
    })
    .catch((error) => {
      this.setState({contents: error});
    });
  }

  componentDidUpdate() {
    // Scroll to the bottom whenever the component updates
    this.textArea.scrollTop = this.textArea.scrollHeight - this.textArea.clientHeight
  }

  render() {
    return (
      <div>
        <textarea 
          ref={(comp) => {this.textArea = comp; }}
          className="log-viewer rounded-corner"
          wrap='off'
          value={this.state.contents} /> 
      </div>
    );
  }
}

export default LogViewer;
