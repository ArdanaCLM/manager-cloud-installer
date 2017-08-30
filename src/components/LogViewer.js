import React, { Component } from 'react';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import { List } from 'immutable';
import io from 'socket.io-client';
import debounce from 'lodash/debounce';

class LogViewer extends Component {

  constructor(props) {
    super(props);

    // List for capturing messages as they are received.  The state
    // variable will be updated regularly with the contents of this
    // list.
    var received = List();

    this.state = {
      contents: List(),
      autoScroll: true
    };

    fetch('http://localhost:8081/api/v1/clm/plays/' + props.playId, {
      // Note: Use no-cache in order to get an up-to-date response
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
        fetch('http://localhost:8081/api/v1/clm/plays/' + props.playId + "/log")
        .then(response => response.text())
        .then(response => {
          const message = response.trimRight('\n')
          received = List(message)
          this.setState({contents: received});
        })
      } else {
        // TODO(gary): Go through the shim layer when that API is available
        this.socket = io('http://localhost:9085');

        this.socket.on('connect', data => {
          this.socket.emit('join', response['id']);
        });

        this.socket.on('log', data => {
          if (data.length>1000) {
          }
          received = received.push(data);
          this.updateState(received);
        });

        this.socket.on('end', data => {
          this.socket.disconnect();
        });
      }
    })
    .catch((error) => {
      list = error.trimRight('\n').split('\n');
      this.setState({contents: List(list)});
    });
  }

  // Update the state.  Uses lodash.debounce to avoid getting inunadated by fast logs,
  // by avoiding repeated calls within a short amount of time
  updateState = debounce((data) => {
    this.setState({contents: data});
  }, 100)

  componentDidUpdate(prevProps, prevState) {
    // Scroll to the bottom whenever the component updates
    if (prevState.autoScroll) {
      this.viewer.scrollTop = this.viewer.scrollHeight - this.viewer.clientHeight;
    }
  }

  handleChange = (e) => {
    this.setState({autoScroll: e.target.checked});
  }
 
  render() {
    return (
      <div>
        <div className="log-viewer">
          <pre className="rounded-corner" ref={(comp) => {this.viewer = comp; }}>
            {this.state.contents.join('')}
          </pre>
        </div>
        <label>
          <input type="checkbox"
                 checked={this.state.autoScroll}
                 onChange={this.handleChange} /> {translate('logviewer.autoscroll')}
        </label>
      </div>
    );
  }

  componentWillUnmount() {
    // Disconnect from the socket to avoid receiving any further log messages
    if (this.socket) {
      this.socket.disconnect();
    }

    // Cancel any pending setState, which otherwise may generate reactjs errors about
    // calling setState on an unmounted component
    this.updateState.cancel();
  }
}

export default LogViewer;
