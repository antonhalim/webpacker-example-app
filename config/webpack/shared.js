// Note: You must restart bin/webpack-watcher for changes to take effect

const webpack = require('webpack')
const path = require('path')
const process = require('process')
const glob = require('glob')
const ManifestPlugin = require('webpack-manifest-plugin')
const extname = require('path-complete-extname')
const {
  srcPath,
  distDir,
  distPath,
  nodeModulesPath,
  manifestFileName
} = require('../../package.json').webpacker

const config = {
  entry: glob.sync(path.join(srcPath, distDir, '*.js*')).reduce(
    (map, entry) => {
      const basename = path.basename(entry, extname(entry))
      const localMap = map
      localMap[basename] = path.resolve(entry)
      return localMap
    }, {}
  ),

  output: { filename: '[name].js', path: path.resolve(distPath) },

  module: {
    rules: [
      { test: /.ts$/, loader: 'ts-loader' },
      {
        test: /.vue$/, loader: 'vue-loader',
        options: {
          loaders: { 'scss': 'vue-style-loader!css-loader!sass-loader', 'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax'}
        }
      },
      { test: /\.coffee(\.erb)?$/, loader: 'coffee-loader' },
      {
        test: /\.(js|jsx)?(\.erb)?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            'react',
            ['env', { modules: false }]
          ]
        }
      },
      {
        test: /\.erb$/,
        enforce: 'pre',
        exclude: /node_modules/,
        loader: 'rails-erb-loader',
        options: {
          runner: 'DISABLE_SPRING=1 bin/rails runner'
        }
      }
    ]
  },

  plugins: [
    new webpack.EnvironmentPlugin(Object.keys(process.env).filter(index => (
      process.env[index] === undefined
    ))),
    new ManifestPlugin({
      fileName: manifestFileName,
      publicPath: `/${distDir}/`
    })
  ],

  resolve: {
    alias: { 'vue$':'vue/dist/vue.esm.js' },
    extensions: ['.js', '.coffee', '.ts'],
    modules: [
      path.resolve(srcPath),
      path.resolve(nodeModulesPath)
    ]
  },

  resolveLoader: {
    modules: [path.resolve(nodeModulesPath)]
  }
}

module.exports = {
  srcPath,
  distDir,
  distPath,
  nodeModulesPath,
  config
}
