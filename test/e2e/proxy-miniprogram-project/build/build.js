const rm = require('rimraf')
const chalk = require('chalk')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const program = require('commander')
const { userConf, supportedModes } = require('../config/index')
const getWebpackConf = require('./getWebpackConf')
const { resolveDist, getRootPath } = require('./utils')
const { syncProjectConfig } = require('./syncProjectConfig')
const devServer = require('../config/devServer')

program
  .option('-w, --watch', 'watch mode')
  .option('-p, --production', 'production release')
  .parse(process.argv)

const env = process.env

const modeStr = env.npm_config_mode || env.npm_config_modes || ''

const report = env.npm_config_report

const modes = modeStr.split(/[,|]/)
  .map((mode) => {
    const modeArr = mode.split(':')
    if (supportedModes.includes(modeArr[0])) {
      return {
        mode: modeArr[0],
        env: modeArr[1]
      }
    }
  }).filter((item) => item)
if (!modes.length) {
  modes.push({
    mode: userConf.srcMode
  })
}

// 同步 dist 中 project config 文件
syncProjectConfig()

// 开启子进程
if (userConf.openChildProcess && modes.length > 1) {
  let scriptType = ''
  const isProduct = program.production
  const isWatch = program.watch
  if (!isProduct && isWatch) scriptType = 'watch'
  if (isProduct && !isWatch) scriptType = 'build'
  if (isProduct && isWatch) scriptType = 'watch:prod'
  if (!isProduct && !isWatch) scriptType = 'build:dev'

  const spawn = require('child_process').spawn
  while (modes.length > 1) {
    const modeObj = modes.pop()
    const modeAndEnv = modeObj.env ? `${modeObj.mode}:${modeObj.env}` : modeObj.mode
    const ls = spawn('npm', ['run', scriptType, `--modes=${modeAndEnv}`, `--mode=${modeAndEnv}`], { stdio: 'inherit' })
    ls.on('close', (code) => {
      process.exitCode = code
    })
  }
}

let webpackConfs = []
let webWebpackConf = null
modes.forEach(({ mode, env }) => {
  const options = Object.assign({}, userConf, {
    mode,
    env,
    production: program.production,
    watch: program.watch,
    report,
    subDir: userConf.isPlugin ? 'miniprogram' : ''
  })
  if (mode === 'web' && program.watch) {
    webWebpackConf = getWebpackConf(options)
    return
  }
  webpackConfs.push(getWebpackConf(options))
})
if (userConf.isPlugin) {
  // 目前支持的plugin构建平台
  modes.filter(({ mode }) => ['wx', 'ali'].includes(mode)).forEach(({ mode, env }) => {
    const options = Object.assign({}, userConf, {
      plugin: true,
      mode,
      env,
      production: program.production,
      watch: program.watch,
      report,
      subDir: 'plugin'
    })
    webpackConfs.push(getWebpackConf(options))
  })
}

if (webpackConfs.length === 1) {
  webpackConfs = webpackConfs[0]
}


try {
  modes.forEach(({ mode, env }) => {
    rm.sync(resolveDist(getRootPath(mode, env), '*'))
  })
} catch (e) {
  console.error(e)
  console.log('\n\n删除dist文件夹遇到了一些问题，如果遇到问题请手工删除dist重来\n\n')
}
if (program.watch) {
  if (webWebpackConf) {
    runServer()
  }
  webpack(webpackConfs).watch(undefined, callback)
} else {
  webpack(webpackConfs, callback)
}

function callback (err, stats) {
  if (err) {
    process.exitCode = 1
    return console.error(err)
  }
  if (Array.isArray(stats.stats)) {
    stats.stats.forEach(item => {
      console.log(item.compilation.name + '打包结果：')
      process.stdout.write(item.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
        entrypoints: false
      }) + '\n\n')
    })
  } else {
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
      entrypoints: false
    }) + '\n\n')
  }

  if (stats.hasErrors()) {
    console.log(chalk.red('  Build failed with errors.\n'))
  } else if (program.watch) {
    console.log(chalk.cyan(`  Build complete at ${new Date()}.\n  Still watching...\n`))
  } else {
    console.log(chalk.cyan('  Build complete.\n'))
  }
}

function runServer () {
  const compiler = webpack(webWebpackConf)
  const server = new WebpackDevServer({
    ...devServer,
    open: true
  }, compiler)
  server.start()
}
