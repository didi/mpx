const fs = require('fs')
const path = require('path')
const workspace = require('path').resolve(__dirname, '../../../..')
const root = '/private/tmp/mpx-address-dialog-validation'
const webpack = require(require.resolve('webpack', { paths: [workspace] }))
const MpxWebpackPlugin = require(require.resolve('@mpxjs/webpack-plugin', { paths: [workspace] }))
const component = path.join(workspace, 'iteration-3/eval-1-keyboard-scroll-adaptation/mpx/outputs/address-dialog.mpx')
fs.writeFileSync(path.join(root, 'app.mpx'), '<script>import { createApp } from \'@mpxjs/core\'; createApp({})</script><style>.app-marker { color: black; }</style><json>{"pages":["./page"]}</json>')
fs.writeFileSync(path.join(root, 'page.mpx'), `<template><address-dialog /></template><script>import { createPage } from '@mpxjs/core'; createPage({})</script><json>${JSON.stringify({ usingComponents: { 'address-dialog': component } })}</json>`)
async function build (mode) {
  const compiler = webpack({
    mode: 'development',
    context: root,
    entry: { app: path.join(root, 'app.mpx') },
    output: { path: path.join(root, `dist-${mode}`), filename: '[name].js', publicPath: '/' },
    resolve: { extensions: ['.mpx', '.js', '.json'], modules: [path.join(workspace, '../node_modules'), 'node_modules'] },
    resolveLoader: { symlinks: false, modules: [path.join(workspace, '../node_modules'), 'node_modules'] },
    module: {
 rules: [
      { test: /\.mpx$/, use: MpxWebpackPlugin.loader() },
      { test: /\.(wxml|axml)$/, use: MpxWebpackPlugin.wxmlLoader() },
      { test: /\.(wxss|acss|css)$/, use: MpxWebpackPlugin.wxssLoader() },
      { test: /\.json$/, resourceQuery: /asScript/, type: 'javascript/auto' }
    ]
},
    optimization: { minimize: false },
    cache: false,
    plugins: [new MpxWebpackPlugin({ mode, srcMode: 'wx', projectRoot: root })]
  })
  await new Promise((resolve, reject) => compiler.run((err, stats) => {
    compiler.close(closeErr => {
      if (err || closeErr) return reject(err || closeErr)
      const report = stats.toJson({ all: false, errors: true, warnings: true, assets: true, modules: true })
      fs.writeFileSync(path.join(root, `app-stats-${mode}.json`), JSON.stringify(report, null, 2))
      console.log(mode, JSON.stringify({ errors: report.errors, warnings: report.warnings, assets: report.assets.map(a => a.name) }))
      if (stats.hasErrors() || stats.hasWarnings()) return reject(new Error(`${mode} build issues`))
      resolve()
    })
  }))
}
(async () => { await build('wx'); await build('ali') })().catch(e => { console.error(e); process.exitCode = 1 })
