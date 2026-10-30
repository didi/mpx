const fs = require('fs')
const path = require('path')
const assert = require('assert')
const webpack = require('webpack')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const root = __dirname
const fixture = path.join(root, 'fixture')
fs.mkdirSync(fixture, { recursive: true })
fs.writeFileSync(path.join(fixture, 'app.mpx'), '<script>import { createApp } from "@mpxjs/core"; createApp({})</script><style>.app-probe { color: #123456; }</style><json>{"pages":["./page.mpx"]}</json>')
fs.writeFileSync(path.join(fixture, 'page.mpx'), '<template><view><address-dialog bindconfirm="onConfirm" /></view></template><script>import { createPage } from "@mpxjs/core"; createPage({methods:{onConfirm(e){console.log(e.detail)}}})</script><json>{"usingComponents":{"address-dialog":"../../address-dialog.mpx"}}</json>')
async function build(mode) {
  const compiler = webpack({
    mode: 'development',
    context: fixture,
    entry: { app: path.join(fixture, 'app.mpx') },
    output: { path: path.join(root, 'dist', mode), filename: '[name].js', clean: true },
    devtool: false,
    module: { rules: [
      { test: /\.mpx$/, use: MpxWebpackPlugin.loader() },
      { test: /\.wxml$/, use: [require.resolve('@mpxjs/webpack-plugin/lib/wxml/loader'), require.resolve('@mpxjs/webpack-plugin/lib/template-compiler')] },
      { test: /\.(wxss|css)$/, use: [require.resolve('@mpxjs/webpack-plugin/lib/wxss'), require.resolve('@mpxjs/webpack-plugin/lib/style-compiler')] },
      { test: /\.json$/, resourceQuery: /asScript/, type: 'javascript/auto' }
    ] },
    plugins: [new MpxWebpackPlugin({ mode, srcMode: 'wx', projectRoot: fixture })]
  })
  const stats = await new Promise((resolve, reject) => compiler.run((err, stats) => {
    compiler.close(closeError => err || closeError ? reject(err || closeError) : resolve(stats))
  }))
  fs.writeFileSync(path.join(root, `stats-${mode}.json`), JSON.stringify(stats.toJson({ all: false, errors: true, warnings: true, modules: true, assets: true }), null, 2))
  console.log(stats.toString({ colors: false, modules: false, assets: true }))
  assert(!stats.hasErrors(), `${mode} build errors`)
  assert(!stats.hasWarnings(), `${mode} build warnings`)
  const modules = Array.from(stats.compilation.modules).map(m => m.resource).filter(Boolean)
  fs.writeFileSync(path.join(root, `modules-${mode}.json`), JSON.stringify(modules, null, 2))
}
(async () => { for (const mode of ['wx', 'ali']) await build(mode) })().catch(e => { console.error(e); process.exitCode = 1 })
