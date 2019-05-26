var ora = require('ora')
var rm = require('rimraf')
var path = require('path')
var chalk = require('chalk')
var webpack = require('webpack')
var merge = require('webpack-merge')
var program = require('commander')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
var webpackMainConfig = require('./webpack.main.conf')
var webpackWxConfig = require('./webpack.wx.conf')

var webpackConfigArr = []
let isPluginProject = false
const userSelectedMode = 'wx'

function resolveDist (file, pathStr = '../dist') {
  return path.resolve(__dirname, pathStr, file || '')
}

const supportedCrossMode = ['wx', 'ali', 'swan', 'qq', 'tt']
const npmConfigArgvOriginal = JSON.parse(process.env.npm_config_argv).original || []
const modeArr = npmConfigArgvOriginal.filter(item => typeof item === 'string').map(item => item.replace('--', '')).filter(item => supportedCrossMode.includes(item))

if ((isPluginProject && userSelectedMode === 'wx') || modeArr.length === 0) {
  webpackConfigArr.push(merge(userSelectedMode === 'wx' ? webpackWxConfig : webpackMainConfig, {
    output: {
      path: resolveDist('', '../dist/')
    },
    plugins: [
      new MpxWebpackPlugin({
        mode: 'wx',
        srcMode: 'wx'
      })
    ]
  }))
} else {
  modeArr.forEach(item => {
    const webpackCrossConfig = merge(item === 'wx' ? webpackWxConfig : webpackMainConfig, {
      output: {
        path: resolveDist('', '../dist/' + item)
      },
      plugins: [
        new MpxWebpackPlugin({
          mode: item,
          srcMode: 'wx'
        })
      ]
    })
    webpackConfigArr.push(webpackCrossConfig)
  })
}

program
  .option('-w, --watch', 'watch mode')
  .option('-p, --production', 'production release')
  .parse(process.argv)

function runWebpack (cfg) {
  if (program.production || program.watch) {
    const extendCfg = program.production ? { mode: 'production' } : { cache: true }
    if (Array.isArray(cfg)) {
      cfg = cfg.map(item => merge(item, extendCfg))
    } else {
      cfg = merge(cfg, extendCfg)
    }
  }
  if (process.env.npm_config_report) {
    var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
    var mainCfg = Array.isArray(cfg) ? cfg[0] : cfg
    mainCfg.plugins.push(new BundleAnalyzerPlugin())
  }
  if (program.watch) {
    webpack(cfg).watch({}, callback)
  } else {
    webpack(cfg, callback)
  }
}

function callback (err, stats) {
  spinner.stop()
  if (err) return console.error(err)
  process.stdout.write(stats.toString({
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
    entrypoints: false
  }) + '\n\n')

  console.log(chalk.cyan('  Build complete.\n'))
  if (program.watch) {
    console.log(chalk.cyan('  Watching...\n'))
  }
}

var spinner = ora('building...')
spinner.start()

try {
  rm.sync(path.resolve(__dirname, '../dist/*'))
} catch (e) {
  console.error(e)
  console.log('\n\n删除dist文件夹遇到了一些问题，如果遇到问题请手工删除dist重来\n\n')
}
runWebpack(webpackConfigArr)
