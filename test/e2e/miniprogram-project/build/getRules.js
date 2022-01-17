let { mpxLoaderConf } = require('../config/index')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const { resolve, resolveSrc } = require('./utils')

const baseRules = [
  {
    test: /\.js$/,
    loader: 'babel-loader',
    include: [resolve('src'), resolve('test'), resolve('node_modules/@mpxjs')]
  },
  {
    test: /\.json$/,
    resourceQuery: /__component/,
    type: 'javascript/auto'
  },
  {
    test: /\.(wxs|qs|sjs|filter\.js)$/,
    loader: MpxWebpackPlugin.wxsPreLoader(),
    enforce: 'pre'
  },
  {
    test: /\.(png|jpe?g|gif|svg)$/,
    loader: MpxWebpackPlugin.urlLoader({
      name: 'img/[name][hash].[ext]'
    })
  }
]

const eslintRule = {
  test: /\.(js|ts|mpx)$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  include: [resolve('src')]
}

const tsRule = {
  test: /\.ts$/,
  use: [
    'babel-loader',
    'ts-loader'
  ]
}

module.exports = function getRules (options) {
  const { mode, tsSupport, needEslint, plugin, subDir } = options

  let rules = baseRules.slice()

  if (tsSupport) {
    rules.push(tsRule)
  }

  if (needEslint) {
    rules.push(eslintRule)
  }

  if (plugin) {
    rules.push({
      test: /\.json$/,
      resourceQuery: /plugin/,
      use: MpxWebpackPlugin.pluginLoader()
    })
  }

  let currentMpxLoaderConf
  if (typeof mpxLoaderConf === 'function') {
    currentMpxLoaderConf = mpxLoaderConf(options)
  } else {
    currentMpxLoaderConf = mpxLoaderConf
  }

  if (mode === 'web') {
    rules = rules.concat([
      {
        test: /\.mpx$/,
        use: [
          {
            loader: 'vue-loader',
            options: {
              transformToRequire: {
                'mpx-image': 'src',
                'mpx-audio': 'src',
                'mpx-video': 'src'
              }
            }
          },
          MpxWebpackPlugin.loader(currentMpxLoaderConf)
        ]
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      // 如输出web时需要支持其他预编译语言，可以在此添加rule配置
      {
        test: /\.styl(us)?$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'stylus-loader'
        ]
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      }
    ])
  } else {
    rules = rules.concat([
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader(currentMpxLoaderConf)
      }
    ])
  }

  return rules
}
