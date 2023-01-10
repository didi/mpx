const normalize = require('./normalize')
const selectorPath = normalize.lib('selector.js')
const scriptSetupPath = normalize.lib('script-setup-compiler/index.js')
const { has } = require('./set')

const tsLoaderWatchRunFilterLoaders = [
  selectorPath,
  scriptSetupPath,
  'node_modules/vue-loader/lib/index.js'
]

module.exports = (loaders, loaderIndex) => {
  for (let len = loaders.length; len > 0; --len) {
    const currentLoader = loaders[len - 1]
    if (!has(tsLoaderWatchRunFilterLoaders, (filterLoaderPath) => {
      return currentLoader.path.endsWith(filterLoaderPath)
    })) {
      break
    }
    loaderIndex -= 1
  }
  return loaderIndex
}
