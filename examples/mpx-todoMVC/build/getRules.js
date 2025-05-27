let { mpxLoaderConf } = require('../config/index')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const { resolve, getConf } = require('./utils')

const baseRules = [
  {
    test: /\.mpx\.js$/,
    use: {
      loader: 'babel-loader',
      options: {
        // 发包后替换path
        plugins: [require.resolve('@mpxjs/babel-plugin-inject-page-events')]
      }
    }
  },
  {
    test: /\.js$/,
    loader: 'babel-loader',
    include: [resolve('src'), resolve('node_modules/@mpxjs')]
  },
  {
    test: /\.json$/,
    resourceQuery: /asScript/,
    type: 'javascript/auto'
  },
  {
    test: /\.(wxs|qs|sjs|qjs|jds|dds|filter\.js)$/,
    use: [
      MpxWebpackPlugin.wxsPreLoader()
    ],
    enforce: 'pre'
  },
  {
    test: /\.(png|jpe?g|gif|svg)$/,
    use: [
      MpxWebpackPlugin.urlLoader({
        name: 'img/[name][hash].[ext]'
      })
    ]
  },
  {
    test: /\.styl(us)?$/,
    use: [
      'css-loader',
      'stylus-loader'
    ]
  },
  {
    test: /\.(wxss|acss|css|qss|ttss|jxss|ddss)$/,
    use: [
      'css-loader'
    ]
  },
  {
    test: /\.(wxml|axml|swan|qml|ttml|qxml|jxml|ddml)$/,
    use: [
      'html-loader'
    ]
  }
]

const tsRule = {
  test: /\.ts$/,
  use: [
    'babel-loader',
    {
      loader: 'ts-loader',
      options: {
        appendTsSuffixTo: [/\.(mpx|vue)$/]
      }
    }
  ]
}

module.exports = function getRules (options) {
  const { tsSupport } = options

  let rules = baseRules.slice()

  if (tsSupport) {
    rules.push(tsRule)
  }

  const currentMpxLoaderConf = getConf(mpxLoaderConf, options)
  rules.push({
    test: /\.mpx$/,
    use: MpxWebpackPlugin.loader(currentMpxLoaderConf)
  })
  return rules
}
