module.exports = {
  entry: './index.js',
  output: {
    filename: 'public/bundle.js'
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        exclude: /(node_modules|server.js)/,
        query: {
          cacheDirectory: true,
          presets: ['react', 'es2015', 'stage-2']
        }
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
      }
    ]
  }
};
