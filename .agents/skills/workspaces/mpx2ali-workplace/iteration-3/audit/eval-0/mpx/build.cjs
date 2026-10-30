const fs = require('fs')
const path = require('path')
const assert = require('assert')
const vm = require('vm')
const workspace = require('path').resolve(__dirname, '../../../..')
const root = __dirname
const component = path.join(workspace, 'iteration-3/eval-0-text-image-adaptation/mpx/outputs/product-card.mpx')
const webpack = require(require.resolve('webpack'))
const MpxWebpackPlugin = require(require.resolve('@mpxjs/webpack-plugin'))
const fixture = path.join(root, 'fixture')
fs.mkdirSync(fixture, { recursive: true })
fs.writeFileSync(path.join(fixture, 'app.mpx'), '<script>App({})</script><json>{"pages":["./page"]}</json>')
fs.writeFileSync(path.join(fixture, 'page.mpx'), `<template><view><text class="title">宿主标题</text><text class="price">宿主价格</text><product-card title="这是一段用于检查单行截断的很长很长很长很长很长的商品标题" /><sibling /></view></template><script>Page({})</script><style>.title { color: blue; white-space: normal; }.price { color: green; }</style><json>${JSON.stringify({ usingComponents: { 'product-card': component, sibling: './sibling' } })}</json>`)
fs.writeFileSync(path.join(fixture, 'sibling.mpx'), '<template><view><text class="title">兄弟标题</text><text class="price">兄弟价格</text></view></template><script>Component({})</script><style>.title { color: purple; }.price { color: orange; }</style><json>{"component":true}</json>')

function build (mode) {
  const compiler = webpack({
    mode: 'development',
    context: fixture,
    entry: { app: path.join(fixture, 'app.mpx') },
    output: { path: path.join(root, 'dist', mode), filename: '[name].js' },
    devtool: false,
    cache: false,
    resolve: { extensions: ['.mpx', '.js', '.json'], modules: [path.join(workspace, '../node_modules'), 'node_modules'] },
    resolveLoader: { modules: [path.join(workspace, '../node_modules'), 'node_modules'] },
    module: {
 rules: [
      { test: /\.mpx$/, use: MpxWebpackPlugin.loader() },
      { test: /\.wxml$/, use: [MpxWebpackPlugin.wxmlLoader(), require.resolve('@mpxjs/webpack-plugin/lib/template-compiler')] },
      { test: /\.(wxss|css)$/, use: [MpxWebpackPlugin.wxssLoader(), require.resolve('@mpxjs/webpack-plugin/lib/style-compiler')] },
      { test: /\.json$/, resourceQuery: /asScript/, type: 'javascript/auto' }
    ]
},
    plugins: [new MpxWebpackPlugin({ mode, srcMode: 'wx', projectRoot: workspace })],
    optimization: { minimize: false },
    performance: false
  })
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) return compiler.close(() => reject(error))
      const report = stats.toJson({ all: false, errors: true, warnings: true, assets: true, modules: true })
      fs.writeFileSync(path.join(root, `stats-${mode}.json`), JSON.stringify(report, null, 2))
      console.log(`${mode}: errors=${report.errors.length}, warnings=${report.warnings.length}`)
      if (report.errors.length || report.warnings.length) console.log(JSON.stringify(report.errors.concat(report.warnings), null, 2))
      compiler.close(closeError => {
        if (closeError) return reject(closeError)
        if (stats.hasErrors() || stats.hasWarnings()) return reject(new Error(`${mode} compilation diagnostics`))
        const assets = stats.compilation.getAssets()
        const readAsset = name => fs.readFileSync(path.join(root, 'dist', mode, name), 'utf8')
        const extension = mode === 'ali' ? '.axml' : '.wxml'
        const card = assets.find(asset => asset.name.endsWith(extension) && readAsset(asset.name).includes('id="summary-root"'))
        assert(card, 'summary-root remains in component output')
        const template = readAsset(card.name)
        const styleName = card.name.replace(extension, mode === 'ali' ? '.acss' : '.wxss')
        const style = readAsset(styleName)
        assert(!/class="(?:title|price)(?:\s|")/.test(template))
        assert(style.includes('white-space: nowrap'))
        assert(style.includes('text-overflow: ellipsis'))
        assert(style.includes('padding: 24rpx'))
        assert(template.includes('mode="aspectFit"'))
        assert(template.includes(mode === 'ali' ? 'onTap=' : 'bindtap='))
        if (mode === 'ali') {
          assert(/\.product-card-title\._\w+/.test(style), 'scoped title selector')
          assert(/\.product-card-price\._\w+/.test(style), 'scoped price selector')
          const app = readAsset('app.acss')
          assert(app.includes('@import "./mpx-ali-compat.acss";'))
          const compat = readAsset('mpx-ali-compat.acss')
          assert(compat.includes('text {\n  white-space: inherit;'))
        } else {
          assert(!stats.compilation.getAsset('mpx-ali-compat.acss'))
        }
        console.log(`${mode}: checked ${card.name}, ${styleName}; root id, title, image, event and isolation structure passed`)
        resolve()
      })
    })
  })
}

async function main () {
  const source = fs.readFileSync(component, 'utf8')
  const input = fs.readFileSync(path.join(workspace, 'iteration-3/eval-0-text-image-adaptation/input/product-card.mpx'), 'utf8')
  const getScript = content => content.match(/<script>([\s\S]*?)<\/script>/)[1]
  assert.strictEqual(getScript(source), getScript(input), 'original properties and methods are unchanged')
  let options
  vm.runInNewContext(getScript(source).replace("import { createComponent } from '@mpxjs/core'", ''), { createComponent: value => { options = value } })
  const calls = []
  const instance = { title: '长商品标题', disabled: true, triggerEvent: (name, detail) => calls.push({ name, detail }) }
  options.methods.select.call(instance)
  assert.strictEqual(calls.length, 0)
  instance.disabled = false
  options.methods.select.call(instance)
  assert.strictEqual(calls.length, 1)
  assert.strictEqual(calls[0].name, 'select')
  assert.strictEqual(calls[0].detail.title, instance.title)
  console.log('script smoke: properties/methods unchanged; disabled suppresses select; enabled emits select with title')
  await build('wx')
  await build('ali')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
