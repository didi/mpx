/* eslint-disable no-tabs */
/*
To specify the package to build, simply pass its name and the desired build
formats to output (defaults to `buildOptions.formats` specified in that package):
*/

const path = require('path')
const chalk = require('chalk')
const execa = require('execa')
// eslint-disable-next-line no-unused-vars
const { targets: allTargets } = require('./utils')

run()

async function run () {
  if (!allTargets.length) {
    console.log(
      chalk.bold(
        chalk.yellow(
          'No package project need to build, please check carefully!'
        )
      )
    )
    return
  }

  await buildAllPackages(allTargets)
}

async function buildAllPackages (targets) {
  await runParallel(require('os').cpus().length, targets, build)
}

async function runParallel (maxConcurrency, source, iteratorFn) {
  const ret = []
  const executing = []
  for (const item of source) {
    const p = Promise.resolve().then(() => iteratorFn(item, source))
    ret.push(p)

    if (maxConcurrency <= source.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing)
      }
    }
  }
  return Promise.all(ret)
}

// 单个 package 打包处理
async function build (target) {
  const pkgDir = path.resolve(`packages/${target}`)
  const pkg = require(`${pkgDir}/package.json`)

  const env = (pkg.buildOptions && pkg.buildOptions.env) || 'production'
  await execa(
    'rollup',
    [
      '-c',
      '--environment',
      [`NODE_ENV:${env}`, `TARGET:${target}`].filter(Boolean).join(',')
    ],
    {
      stdio: 'inherit'
    }
  )
}
