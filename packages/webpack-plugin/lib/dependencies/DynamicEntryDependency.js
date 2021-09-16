const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class DynamicEntryDependency extends NullDependency {
  constructor (options = {}, range) {
    super()
    this.options = options
    this.range = range
  }

  get type () {
    return 'mpx dynamic entry'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const parentEntryNode = mpx.getEntryNode(module)
    this.dep = mpx.addEntry(this.request, this.name, this.entryType, (err, entryModule) => {
      if (err) return callback(err)
      const entryNode = mpx.getEntryNode(entryModule, this.entryType)
      parentEntryNode.addChild(entryNode)
      return callback(null, entryModule)
    })
  }

  serialize (context) {
    const { write } = context
    write(this.options)
    write(this.range)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.options = read()
    this.range = read()
    super.deserialize(context)
  }
}

DynamicEntryDependency.Template = class DynamicEntryDependency {
  apply (dependency, source, templateContext) {
  }
}

makeSerializable(DynamicEntryDependency, '@mpxjs/webpack-plugin/lib/dependencies/DynamicEntryDependency')

module.exports = DynamicEntryDependency
