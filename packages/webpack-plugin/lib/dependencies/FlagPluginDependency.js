const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class FlagPluginDependency extends NullDependency {
  get type () {
    return 'mpx flag plugin'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    mpx.isPluginMode = true
    mpx.getEntryNode(module, 'plugin')
    return callback()
  }
}

FlagPluginDependency.Template = class FlagPluginDependencyTemplate {
  apply () {
  }
}

makeSerializable(FlagPluginDependency, '@mpxjs/webpack-plugin/lib/dependencies/FlagPluginDependency')

module.exports = FlagPluginDependency
