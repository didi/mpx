const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class InjectDependency extends NullDependency {
  constructor (options = {}) {
    super()
    this.content = options.content
    this.index = options.index || 0
  }

  get type () {
    return 'mpx inject'
  }

  updateHash (hash) {
    super.updateHash(hash)
    hash.update(this.content)
  }

  serialize (context) {
    const { write } = context
    write(this.content)
    write(this.index)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.content = read()
    this.index = read()
    super.deserialize(context)
  }
}

InjectDependency.Template = class InjectDependencyTemplate {
  apply (dep, source) {
    source.insert(dep.index, '/* mpx inject */ ' + dep.content)
  }
}

makeSerializable(InjectDependency, '@mpxjs/webpack-plugin/lib/dependencies/InjectDependency')

module.exports = InjectDependency
