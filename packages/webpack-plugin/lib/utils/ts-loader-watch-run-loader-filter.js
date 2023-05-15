const normalize = require('./normalize')
const selectorPath = normalize.lib('selector.js')
const scriptSetupPath = normalize.lib('script-setup-compiler/index.js')
const mpxLoaderPath = normalize.lib('loader.js')
const { has } = require('./set')

const tsLoaderWatchRunFilterLoaders = new Set([
  selectorPath,
  scriptSetupPath,
  mpxLoaderPath,
  'node_modules/vue-loader/lib/index.js'
])

module.exports = (loaders, loaderIndex) => {
  for (let i = loaderIndex; i >= 0; i--) {
    const currentLoader = loaders[i]
    if (!has(tsLoaderWatchRunFilterLoaders, filterLoaderPath => currentLoader.path.endsWith(filterLoaderPath))) {
      return i
    }
  }
  return loaderIndex
}
