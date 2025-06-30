const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordRNExternalDependency extends NullDependency {
  constructor (request) {
    super()
    this.rnExternalRequest = request
  }

  get type () {
    return 'mpx record rn external request'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    mpx.rnExternalRequests.add(this.rnExternalRequest)
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.rnExternalRequest)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.rnExternalRequest = read()
    super.deserialize(context)
  }
}

RecordRNExternalDependency.Template = class RecordRNExternalDependencyTemplate {
  apply () {
  }
}

makeSerializable(RecordRNExternalDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordRNExternalDependency')

module.exports = RecordRNExternalDependency
