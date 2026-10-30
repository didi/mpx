const fs = require('fs')
const path = require('path')
const assert = require('assert')
const webpack = require('webpack')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const root = path.join(__dirname, 'src')
const component = path.resolve(__dirname, '../outputs/product-card.mpx')
fs.writeFileSync(path.join(root, 'app.mpx'), '<script>import { createApp } from "@mpxjs/core"; createApp({})</script><json>{"pages":["./page.mpx"]}</json>')
fs.writeFileSync(path.join(root, 'page.mpx'), `<template><view><view class="title">宿主标题</view><text class="price">宿主价格</text><product-card title="很长很长很长很长很长很长很长很长的商品标题" bindselect="onSelect"/><sibling/></view></template><script>import { createPage } from '@mpxjs/core'; createPage({ methods: { onSelect () {} } })</script><style>.title { color: blue; white-space: normal; }.price { color: green; }</style><json>${JSON.stringify({ usingComponents: { 'product-card': component, sibling: './sibling.mpx' } })}</json>`)
fs.writeFileSync(path.join(root, 'sibling.mpx'), '<template><view class="title"><text class="price">兄弟组件</text></view></template><script>import { createComponent } from "@mpxjs/core"; createComponent({})</script><style>.title { font-size: 50rpx; }.price { color: purple; }</style><json>{"component":true}</json>')
async function build (mode) {
  const compiler = webpack({
    mode: 'development',
devtool: false,
context: root,
    entry: { app: path.join(root, 'app.mpx') },
    output: { path: path.join(__dirname, 'dist', mode), filename: '[name].js', publicPath: '/' },
    resolve: { extensions: ['.js', '.ts', '.json'], modules: [path.resolve(process.cwd(), '../node_modules'), 'node_modules'] },
    resolveLoader: { symlinks: false, modules: [path.resolve(process.cwd(), '../node_modules'), 'node_modules'] },
    module: {
 rules: [
      { test: /\.mpx$/, use: MpxWebpackPlugin.loader() },
      { test: /\.wxml$/, use: MpxWebpackPlugin.wxmlLoader() },
      { test: /\.(wxss|css)$/, use: MpxWebpackPlugin.wxssLoader() },
      { test: /\.json$/, resourceQuery: /asScript/, type: 'javascript/auto' }
    ]
},
    plugins: [new MpxWebpackPlugin({ mode, srcMode: 'wx', projectRoot: root, generateBuildMap: true })]
  })
  const stats = await new Promise((resolve, reject) => compiler.run((error, stats) => {
    compiler.close(closeError => error || closeError ? reject(error || closeError) : resolve(stats))
  }))
  const info = stats.toJson({ all: false, errors: true, warnings: true, assets: true, modules: true })
  fs.writeFileSync(path.join(__dirname, `stats-${mode}.json`), JSON.stringify(info, null, 2))
  console.log(stats.toString({ all: false, errors: true, warnings: true, assets: true, timings: true }))
  assert(!stats.hasErrors(), `${mode}: build errors`)
  const modulePaths = Array.from(stats.compilation.modules).map(m => m.resource).filter(Boolean)
  console.log(`${mode}: core source bundled: ${modulePaths.some(p => p.startsWith(require('path').resolve(__dirname, '../../../../../node_modules/@mpxjs/core/src')))}`)
  console.log(`${mode}: ${stats.compilation.getAssets().length} assets, ${info.warnings.length} warnings`)
}
;(async () => { for (const mode of ['wx', 'ali']) await build(mode) })().catch(error => { console.error(error); process.exitCode = 1 })
