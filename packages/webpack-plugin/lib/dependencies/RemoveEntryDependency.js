const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RemoveEntryDependency extends NullDependency {
  constructor (entryName) {
    super()
    this.entryName = entryName
  }

  get type () {
    return 'mpx remove entry'
  }

  serialize (context) {
    const { write } = context
    write(this.entryName)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.entryName = read()
    super.deserialize(context)
  }

  mpxAction (module, compilation, callback) {
    const { entryName } = this
    compilation.entries.delete(entryName)
    return callback()
  }
}

RemoveEntryDependency.Template = class RemoveEntryDependencyTemplate {
  apply () {
  }
}

makeSerializable(RemoveEntryDependency, '@mpxjs/webpack-plugin/lib/dependencies/RemoveEntryDependency')

module.exports = RemoveEntryDependency
