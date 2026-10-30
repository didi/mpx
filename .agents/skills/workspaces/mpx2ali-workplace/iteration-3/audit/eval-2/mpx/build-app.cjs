const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const projectRoot = require('path').resolve(__dirname, '../../../..')
const local = request => require.resolve('@mpxjs/webpack-plugin/lib/' + request)

async function build (mode) {
  const config = {
    mode: 'production',
    context: projectRoot,
    entry: { app: path.join(__dirname, 'app.mpx') },
    output: { path: path.join(__dirname, 'compiled-' + mode), filename: '[name].js' },
    devtool: 'source-map',
    performance: { hints: false },
    optimization: { minimize: false },
    resolve: { extensions: ['.js', '.mpx'], modules: [path.join(projectRoot, '../node_modules'), 'node_modules'] },
    resolveLoader: { modules: [path.join(projectRoot, '../node_modules'), 'node_modules'] },
    module: {
      rules: [
        { test: /\.json$/, resourceQuery: /asScript/, type: 'javascript/auto' },
        { test: /\.mpx$/, use: [MpxWebpackPlugin.loader()] },
        // Explicitly wire the installed registry compiler after realpath resolution.
        { test: /\.(wxml|axml)$/, use: [MpxWebpackPlugin.wxmlLoader(), local('template-compiler/index.js')] },
        { test: /\.(wxss|acss)$/, use: [MpxWebpackPlugin.wxssLoader(), local('style-compiler/index.js')] },
        { test: /\.js$/, exclude: /node_modules/, use: [{ loader: require.resolve('babel-loader'), options: { configFile: path.join(projectRoot, 'babel.config.json') } }] }
      ]
    },
    plugins: [new MpxWebpackPlugin({ mode, srcMode: 'wx', projectRoot })]
  }
  const compiler = webpack(config)
  const stats = await new Promise((resolve, reject) => compiler.run((error, result) => error ? reject(error) : resolve(result)))
  const report = stats.toJson({ all: false, errors: true, warnings: true, modules: true })
  fs.writeFileSync(path.join(__dirname, 'app-stats-' + mode + (stats.hasErrors() ? '-failed' : '') + '.json'), JSON.stringify(report, null, 2))
  console.log(mode + ': errors=' + report.errors.length + ', warnings=' + report.warnings.length)
  if (stats.hasErrors() || stats.hasWarnings()) process.exitCode = 1
  await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
}

async function main () {
  await build('wx')
  await build('ali')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
