const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class DynamicEntryDependency extends NullDependency {
  constructor (request, name, entryType, range) {
    super()
    this.request = request
    this.name = name
    this.entryType = entryType
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
    write(this.request)
    write(this.name)
    write(this.entryType)
    write(this.range)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.request = read()
    this.name = read()
    this.entryType = read()
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
