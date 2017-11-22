'use strict';

var production = process.env.NODE_ENV === 'production';

var path = require('path');
var webpack = require('webpack');
var functions = require('postcss-functions');
const StatsPlugin = require('stats-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

var autoprefixer = require('autoprefixer');

var host = process.env.HOST || 'localhost'
var devServerPort = 7000;
var nm_path = path.resolve(__dirname, "..", "node_modules");

const extractSass = new ExtractTextPlugin({
  filename: production ? "[name].[contenthash].css" : "[name].css",
});

var sassExtractor = () => {
  return ['css-hot-loader'].concat(extractSass.extract({
    use: [{
      loader: "css-loader",
      options: {
        sourceMap: !production,
        minimize: production
      }
    }, {
      loader: "sass-loader",
      options: {
        sourceMap: !production
      }
    }],
    fallback: "style-loader"
  }));
}

var config = {
  entry: {
    vendor: [
      'jquery/dist/jquery'
    ],
    application: 'application.es6',
  },

  module: {
    rules: [{
        test: /\.es6/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["env"]
          }
        }
      },
      {
        test: /\.pug/,
        loader: "pug-loader",
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        use: "file-loader"
      },
      {
        test: /\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.otf($|\?)|\.eot($|\?)|\.svg($|\?)/,
        use: 'file-loader'
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: sassExtractor()
      }
    ]
  },

  output: {
    // Build assets directly in to public/webpack/, let webpack know
    // that all webpacked assets start with webpack/

    // must match config.webpack.output_dir
    path: path.join(__dirname, '..', 'public', 'webpack'),
    publicPath: '/webpack/',

    filename: production ? '[name]-[chunkhash].js' : '[name].js',
    chunkFilename: production ? '[name]-[chunkhash].js' : '[name].js'
  },

  resolve: {
    modules: [
      path.resolve(__dirname, "..", "webpack"),
      nm_path
    ],
    extensions: [".js", ".es6", ".css", ".sass", ".scss"],
    alias: {
      '~': path.resolve(__dirname, "..", "webpack"),
    }
  },

  plugins: [
    extractSass,
    new StatsPlugin('manifest.json', {
      chunkModules: false,
      source: false,
      chunks: false,
      modules: false,
      assets: true
    }),
    new webpack.ProvidePlugin({
      $: "jquery/dist/jquery",
      jQuery: "jquery/dist/jquery",
      "window.jQuery": "jquery/dist/jquery",
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      chunks: ["vendor", "application"],
      minChunks: Infinity,
    }),
  ]
};

if (production) {
  config.plugins.push(
    new UglifyJSPlugin({
      test: /\.js($|\?)/i
    }),
    new webpack.DefinePlugin({ // <--key to reduce React's size
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new CompressionPlugin({
      asset: "[path].gz",
      algorithm: "gzip",
      test: /\.js$|\.css$/,
      threshold: 4096,
      minRatio: 0.8
    })
  );
} else {
  config.plugins.push(
    new webpack.NamedModulesPlugin()
  )

  config.devServer = {
    port: devServerPort,
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
  };
  config.output.publicPath = 'http://' + host + ':' + devServerPort + '/webpack/';
  config.devtool = 'source-map';
}

module.exports = config;
