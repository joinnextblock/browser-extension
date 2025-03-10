const webpack = require('webpack');
const path = require('path');
const dotenv = require('dotenv');
const env = dotenv.config().parsed;

module.exports = {
  mode: env.NEXTBLOCK_WEBPACK_MODE,
  devtool: 'source-map',
  entry: {
    popup: './src/popup/index.ts',
    background: './src/background.ts',
    content: './src/content.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    minimize: true
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(env)
    })
  ],
}; 