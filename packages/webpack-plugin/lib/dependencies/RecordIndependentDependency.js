const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordIndependentDependency extends NullDependency {
  constructor (root, request) {
    super()
    this.root = root
    this.request = request
  }

  get type () {
    return 'mpx record independent'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const { root, request } = this
    mpx.independentSubpackagesMap[root] = request
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.root)
    write(this.request)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.root = read()
    this.request = read()
    super.deserialize(context)
  }
}

RecordIndependentDependency.Template = class RecordIndependentDependencyTemplate {
  apply () {
  }
}

makeSerializable(RecordIndependentDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordIndependentDependency')

module.exports = RecordIndependentDependency
