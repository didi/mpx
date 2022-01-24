const VirtualModulesPlugin = require('webpack-virtual-modules')
const WatchIgnorePlugin = require('webpack/lib/WatchIgnorePlugin')

const virtualModules = new VirtualModulesPlugin()
const watchIgnorePlugin = new WatchIgnorePlugin({
  paths: [/mpx-custom-element-*/]
})

module.exports = class RuntimeRenderPlugin {
  constructor () {}
  apply (compiler) {
    virtualModules.apply(compiler)
    watchIgnorePlugin.apply(compiler)
  }
}

module.exports.virtualModules = virtualModules
