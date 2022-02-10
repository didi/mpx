const { RawSource } = require('webpack').sources

module.exports = (module, name, content, sourceMap, assetInfo) => {
  if (!module.buildInfo.assets) {
    module.buildInfo.assets = Object.create(null)
    module.buildInfo.assetsInfo = new Map()
  }
  module.buildInfo.assets[name] = new RawSource(content)
  module.buildInfo.assetsInfo.set(name, assetInfo)
}
