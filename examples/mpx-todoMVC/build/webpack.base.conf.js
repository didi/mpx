var path = require('path')
var MpxWebpackPlugin = require('@mpxjs/webpack-plugin')

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

var webpackConf = {
  module: {
    rules: [
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader({
          transRpx: false,
          comment: 'use rpx',
          compileBindEvent: true
        })
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src'), resolve('test'), resolve('node_modules/mpx')]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        loader: '@mpxjs/url-loader',
        options: {
          autoBase64: true,
          name: 'img/[name].[ext]'
        }
      }
    ]
  },
  output: {
    filename: '[name].js',
    publicPath: '/'
  },
  optimization: {
    runtimeChunk: {
      name: 'bundle'
    },
    splitChunks: {
      chunks: 'all',
      name: 'bundle',
      minChunks: 2
    }
  },
  mode: 'none',
  plugins: [
    new MpxWebpackPlugin({
      mode: 'wx'
    })
  ],
  resolve: {
    extensions: ['.js', '.mpx'],
    modules: ["node_modules"]
  }
}


module.exports = webpackConf
