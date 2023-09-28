const { merge } = require('webpack-merge');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const productionConfig = require('./webpack.config.production.js');

module.exports = merge(productionConfig, {
  plugins: [new BundleAnalyzerPlugin()],
});
