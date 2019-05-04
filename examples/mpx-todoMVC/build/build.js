var ora = require('ora')
var rm = require('rimraf')
var path = require('path')
var chalk = require('chalk')
var webpack = require('webpack')
var merge = require('webpack-merge')
var program = require('commander')
var webpackConfig = require('./webpack.main.conf')

var prodEnv = require('../config/prod.env')
var devEnv = require('../config/dev.env')

program
  .option('-w, --watch', 'watch mode')
  .option('-p, --production', 'production release')
  .parse(process.argv)

function runWebpack (cfg) {
  // env
  if (Array.isArray(cfg)) {
    cfg.forEach(item => item.plugins.unshift(new webpack.DefinePlugin(program.production ? prodEnv : devEnv)))
  } else {
    cfg.plugins.unshift(new webpack.DefinePlugin(program.production ? prodEnv : devEnv))
  }

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
  const distSrc = process.env.npm_config_ali ? '../alidist/*' : '../dist/*'
  rm.sync(path.resolve(__dirname, distSrc))
} catch (e) {
  console.error(e)
  console.log('\n\n删除dist文件夹遇到了一些问题，如果遇到问题请手工删除dist重来\n\n')
}
runWebpack(webpackConfig)
