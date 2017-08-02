import { AppContainer } from 'react-hot-loader';
import React from 'react';
import ReactDOM from 'react-dom';

import Deployer from './src/Deployer';
import './src/Deployer.css';

const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('root')
  );
};

render(Deployer);


if (module.hot) {
  module.hot.accept('./src/Deployer', () => {
    const Deployer = require('./src/Deployer.js').default;
    render(Deployer); });
}
