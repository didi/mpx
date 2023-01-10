const normalize = require('./normalize')
const selectorPath = normalize.lib('selector.js')
const scriptSetupPath = normalize.lib('script-setup-compiler/index.js')
const { has } = require('./set')

const tsLoaderWatchRunFilterLoaders = [
  selectorPath,
  scriptSetupPath
]

module.exports = (loaders) => {
  let loaderLen = loaders.length
  while (loaderLen > 0) {
    const currentLoader = this.loaders[loaderLen - 1]
    if (!has(tsLoaderWatchRunFilterLoaders, (filterLoaderPath) => {
      return currentLoader.path.endsWith(filterLoaderPath)
    })) {
      break
    }
    loaderLen -= 1
    this.loaderIndex -= 1
  }
}
