const normalize = require('./normalize')
const selectorPath = normalize.lib('selector.js')
const scriptSetupPath = normalize.lib('script-setup-compiler/index.js')
const { has } = require('./set')

const tsLoaderWatchRunFilterLoaders = [
  selectorPath,
  scriptSetupPath
]

module.exports = (loaders, loaderIndex) => {
  let loaderLen = loaders.length
  while (loaderLen > 0) {
    const currentLoader = loaders[loaderLen - 1]
    if (!has(tsLoaderWatchRunFilterLoaders, (filterLoaderPath) => {
      return currentLoader.path.endsWith(filterLoaderPath)
    })) {
      break
    }
    loaderLen -= 1
    loaderIndex -= 1
  }
  return loaderIndex
}
