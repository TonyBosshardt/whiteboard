const webpack = require('webpack');
const { merge } = require('webpack-merge');
const path = require('path');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const baseConfig = require('./webpack.config.base.js');

const srcPath = path.resolve(__dirname, '../');
const distPath = path.resolve(__dirname, '../dist');

module.exports = merge(baseConfig, {
  mode: 'development',
  output: {
    path: distPath,
    filename: 'bundle.js',
    publicPath: '/',
  },
  devServer: {
    port: 8080,
    historyApiFallback: true,
    hot: true,
    static: [],
    host: '0.0.0.0', // your ip address,
    allowedHosts: ['localhost'],
  },
  devtool: 'eval-source-map', // not as fast to build or rebuild, but better quality sourcemaps
  watchOptions: {
    // aggregateTimeout: 300,
    poll: 1000,
    ignored: /node_modules/,
  },
  module: {
    rules: [
      {
        test: /^((?!\.min).)+\.js$/, // matches all .js files EXCEPT those with .min.js
        include: srcPath,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          plugins: [require.resolve('react-refresh/babel')],
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        include: srcPath,
        exclude: /node_modules/,
        use: [
          {
            loader: 'style-loader', // creates style nodes from JS strings
          },
          {
            loader: 'css-loader', // translates CSS into CommonJS
          },
          {
            loader: 'sass-loader', // compiles Sass to CSS
          },
        ],
      },
    ],
  },
  plugins: [new webpack.EnvironmentPlugin({}), new ReactRefreshWebpackPlugin()],
});
