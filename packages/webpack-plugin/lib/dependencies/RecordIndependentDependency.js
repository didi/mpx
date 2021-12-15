const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordIndependentDependency extends NullDependency {
  constructor (root) {
    super()
    this.root = root
  }

  get type () {
    return 'mpx record independent'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const { root } = this
    mpx.independentSubpackagesMap[root] = true
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.root)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.root = read()
    super.deserialize(context)
  }
}

RecordIndependentDependency.Template = class RecordIndependentDependencyTemplate {
  apply () {
  }
}

makeSerializable(RecordIndependentDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordIndependentDependency')

module.exports = RecordIndependentDependency
