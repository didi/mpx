const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class ReplaceDependency extends NullDependency {
  constructor (replacement, range) {
    super()
    this.replacement = replacement
    this.range = range
  }

  get type () {
    return 'mpx replace'
  }

  updateHash (hash, context) {
    hash.update(this.replacement)
    super.updateHash(hash, context)
  }

  serialize (context) {
    const { write } = context
    write(this.replacement)
    write(this.range)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.replacement = read()
    this.range = read()
    super.deserialize(context)
  }
}

ReplaceDependency.Template = class ReplaceDependencyTemplate {
  apply (dep, source) {
    source.replace(dep.range[0], dep.range[1] - 1, '/* mpx replace */ ' + dep.replacement)
  }
}

makeSerializable(ReplaceDependency, '@mpxjs/webpack-plugin/lib/dependencies/ReplaceDependency')

module.exports = ReplaceDependency
