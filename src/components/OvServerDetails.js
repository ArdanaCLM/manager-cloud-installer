import React, { Component } from 'react';

class OvServerDetails extends Component {
  constructor(props) {
    super(props);
  }

  renderServerContent() {
    return (
      <div>
        {JSON.stringify(this.props.data)}
      </div>
    );
 }

  render() {
    return (
      <div>
        {this.renderServerContent()}
      </div>
    );
  }
}

export default OvServerDetails;
