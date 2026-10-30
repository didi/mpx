const fs = require('fs')
const path = require('path')
const assert = require('assert')
const webpack = require('webpack')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const workspace = process.cwd()
const repository = require('path').resolve(__dirname, '../../../..')
const resolved = {}
for (const [name, location] of Object.entries({
  '@mpxjs/webpack-plugin': 'node_modules/@mpxjs/webpack-plugin',
  '@mpxjs/core': 'node_modules/@mpxjs/core',
  '@mpxjs/api-proxy': 'node_modules/@mpxjs/api-proxy',
  webpack: 'node_modules/webpack'
})) {
  const actual = fs.realpathSync(require.resolve(name))
  assert(actual.startsWith(fs.realpathSync(path.join(repository, '..', location)) + path.sep))
  resolved[name] = { entry: actual, version: require(name + '/package.json').version }
}
fs.writeFileSync(path.join(__dirname, 'resolved.json'), JSON.stringify({ node: process.version, workspace, resolved }, null, 2))
console.log(JSON.stringify(resolved, null, 2))
async function build (mode) {
  const compiler = webpack({
    mode: 'development',
    context: __dirname,
    entry: { app: './app.mpx' },
    output: { path: path.join(__dirname, 'dist', mode), filename: '[name].js', publicPath: '/' },
    devtool: false,
    resolve: { extensions: ['.js', '.json', '.mpx'], modules: [path.join(workspace, '../node_modules'), 'node_modules'] },
    module: {
 rules: [
      { test: /\.mpx$/, use: MpxWebpackPlugin.loader() },
      { test: /\.(wxml|axml)$/, use: [MpxWebpackPlugin.wxmlLoader(), require.resolve('@mpxjs/webpack-plugin/lib/template-compiler')] },
      { test: /\.(wxss|acss|css)$/, use: [MpxWebpackPlugin.wxssLoader(), require.resolve('@mpxjs/webpack-plugin/lib/style-compiler')] },
      { test: /\.json$/, resourceQuery: /asScript/, type: 'javascript/auto' }
    ]
},
    plugins: [new MpxWebpackPlugin({ mode, srcMode: 'wx' })],
    optimization: { minimize: false },
    cache: false
  })
  await new Promise((resolve, reject) => compiler.run((error, stats) => {
    if (error) return compiler.close(() => reject(error))
    const report = stats.toJson({ all: false, assets: true, errors: true, warnings: true, modules: true, nestedModules: true })
    fs.writeFileSync(path.join(__dirname, `stats-${mode}.json`), JSON.stringify(report, null, 2))
    const log = stats.toString({ colors: false, all: false, assets: true, errors: true, warnings: true, timings: true })
    fs.writeFileSync(path.join(__dirname, `build-${mode}.log`), log + '\n')
    console.log(mode + ':\n' + log)
    compiler.close(closeError => {
      if (closeError || stats.hasErrors()) reject(closeError || new Error(`${mode} build failed`))
      else resolve()
    })
  }))
}
;(async () => {
  await build('wx')
  await build('ali')
})().catch(error => { console.error(error); process.exitCode = 1 })
