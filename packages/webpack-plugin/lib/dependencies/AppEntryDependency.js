const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')


class AppEntryDependency extends NullDependency {
  constructor (resource, name) {
    super()
    this.resource = resource
    this.name = name
  }

  get type () {
    return 'mpx app entry'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    mpx.getEntryNode(module, 'app')
    mpx.appInfo = {
      resource: this.resource,
      name: this.name
    }
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.resource)
    write(this.name)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.resource = read()
    this.name = read()
    super.deserialize(context)
  }
}

AppEntryDependency.Template = class AppEntryDependencyTemplate {
  apply (dependency, source, templateContext) {
  }
}

makeSerializable(AppEntryDependency, '@mpxjs/webpack-plugin/lib/dependencies/AppEntryDependency')

module.exports = AppEntryDependency
