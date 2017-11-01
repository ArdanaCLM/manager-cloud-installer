// (c) Copyright 2017 SUSE LLC
/* global it */
import React from 'react';
import ReactDOM from 'react-dom';
import Deployer from './Deployer';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Deployer />, div);
});
