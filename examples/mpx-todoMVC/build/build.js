var ora = require('ora')
var rm = require('rimraf')
var path = require('path')
var chalk = require('chalk')
var webpack = require('webpack')
var merge = require('webpack-merge')
var program = require('commander')
var webpackConfig = require('./webpack.main.conf')

program
  .option('-w, --watch', 'watch mode')
  .option('-p, --production', 'production release')
  .parse(process.argv)

function runWebpack (cfg) {
  if (program.production || program.watch) {
    cfg = merge(cfg, program.production ? {
      mode: 'production'
    } : {
      cache: true
    })
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
    children: true,
    chunks: false,
    chunkModules: false
  }) + '\n\n')

  console.log(chalk.cyan('  Build complete.\n'))
  if (program.watch) {
    console.log(chalk.cyan('  Watching...\n'))
  }
}

var spinner = ora('building...')
spinner.start()

rm(path.resolve(__dirname, '../dist/*'), err => {
  if (err) return console.error(err)
  runWebpack(webpackConfig)
})
