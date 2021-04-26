const path = require('path')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const ImportReplacePlugin = require('@didi/webpack-import-replace-plugin')

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

// 配置分包内抽取公共jsBundle，进一步降低主包体积
// 抽取规则如下
// 1. 模块被同一分包内2个或以上的chunk所引用
// 2. 能够抽取的模块体积总和>=10kB
// 3. 满足以上条件会将抽取后的bundle输出至dist的分包目录下

function getSubPackagesCacheGroups (packages) {
  let result = {}
  packages.forEach((root) => {
    result[root] = {
      test: (module, chunks) => {
        return chunks.every((chunk) => {
          return (new RegExp(`^${root}\\/`)).test(chunk.name)
        })
      },
      name: `${root}/bundle`,
      minChunks: 2,
      minSize: 10000,
      priority: 100,
      chunks: 'initial'
    }
  })
  return result
}

const webpackConf = {
  module: {
    rules: [
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader({
          transRpx: {
            mode: 'only',
            comment: 'use rpx',
            include: resolve('src')
          }
        })
      },
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
        test: /\.(wxs|sjs|filter\.js)$/,
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
  },
  output: {
    filename: '[name].js'
  },
  plugins: [
    // 替换特殊的引入语句为打点语句用于性能统计分析
    new ImportReplacePlugin({
      test: /performanceLog\?(.*)/,
      replace (rs) {
        if (rs[1] === 'appScriptStart') {
          return `var jsPerfMap = {'${rs[1]}': 0, start: +new Date(), end: +new Date()};global.jsPerfMap = jsPerfMap;`
        }
        if (Array.isArray(rs) && rs.length >= 2) {
          return `var __start = getApp().jsPerfMap.start; var __time = (+new Date()) - __start; getApp().jsPerfMap['${rs[1]}'] = __time;`
        }
        return ''
      }
    })
  ],
  optimization: {
    runtimeChunk: {
      name: 'bundle'
    },
    splitChunks: {
      cacheGroups: {
        main: {
          name: 'bundle',
          minChunks: 2,
          chunks: 'initial'
        },
        // 分包内抽取bundle示例配置，传入分包root数组
        // ...getSubPackagesCacheGroups(Array<subpackage root>)
      }
    }
  },
  mode: 'none',
  resolve: {
    extensions: ['.js', '.mpx'],
    modules: ['node_modules']
  }
}

module.exports = webpackConf
