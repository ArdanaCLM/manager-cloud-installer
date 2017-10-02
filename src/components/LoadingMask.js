import React, { Component } from 'react';
import { ThreeBounce } from 'better-react-spinkit';
import '../Deployer.css';

function LoadingMask(props) {
  if (! props.show)
    return null;

  return (
    <div className={'spinners-container ' + (props.className || '')}>
      <ThreeBounce 
        className='spinners'
        size={props.size || 25}
        color='#00C081'/>
    </div>
  );
}

module.exports = {
  LoadingMask: LoadingMask
};
