const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordGlobalComponentsDependency extends NullDependency {
  constructor (globalComponents, globalComponentsInfo, context) {
    super()
    this.globalComponents = globalComponents
    this.globalComponentsInfo = globalComponentsInfo
    this.context = context
  }

  get type () {
    return 'mpx record global components'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const { globalComponents, globalComponentsInfo } = this

    mpx.globalComponents = globalComponents
    mpx.globalComponentsInfo = globalComponentsInfo
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.globalComponents)
    write(this.globalComponentsInfo)
    write(this.context)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.globalComponents = read()
    this.globalComponentsInfo = read()
    this.context = read()
    super.deserialize(context)
  }
}

RecordGlobalComponentsDependency.Template = class RecordGlobalComponentsDependencyTemplate {
  apply () {
  }
}

makeSerializable(RecordGlobalComponentsDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordGlobalComponentsDependency')

module.exports = RecordGlobalComponentsDependency
