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
  for (let len = loaders.length; len > 0; --len) {
    const currentLoader = loaders[len - 1]
    if (!has(tsLoaderWatchRunFilterLoaders, filterLoaderPath => currentLoader.path.endsWith(filterLoaderPath))) {
      break
    }
    loaderIndex--
  }
  return loaderIndex
}
