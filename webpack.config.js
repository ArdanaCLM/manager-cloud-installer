// (c) Copyright 2017 SUSE LLC
/* eslint no-unused-vars: 0 */
var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [
    'react-hot-loader/patch',
    './index.js'
  ],
  output: {
    filename: 'dist/index.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /(node_modules|server.js)/,
        query: {
          cacheDirectory: true,
          presets: ['react', 'es2015', 'stage-2']
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'react-hot-loader/webpack'
      },
      {
        test: /\.css$/,
        loader: 'style-loader'
      },
      {
        test: /\.css$/,
        loader: 'css-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: 'url-loader'
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader?name=lib/fonts/[name].[ext]'
      }
    ]
  }
};
