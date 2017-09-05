import React, { Component } from 'react';
import { ThreeBounce } from 'better-react-spinkit';
import '../Deployer.css';

class LoadingMask extends Component {
  renderMask() {
    let retValue = <div></div>;
    let spinSize = this.props.size ? this.props.size : 25;
    if(this.props.show) {
      retValue = (
        <div className='spinners-container'>
          <ThreeBounce className='spinners' size={spinSize} color='#00C081'/>
        </div>
      );
    }
    return retValue;
  }

  render() {
    return (
      <div>{this.renderMask()}</div>
    );
  }
}

module.exports = {
  LoadingMask: LoadingMask
};
