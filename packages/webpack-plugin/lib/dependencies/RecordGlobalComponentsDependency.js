const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const addQuery = require('../utils/add-query')

class RecordGlobalComponentsDependency extends NullDependency {
  constructor (usingComponents, context) {
    super()
    this.usingComponents = usingComponents
    this.context = context
  }

  get type () {
    return 'mpx record global components'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const { usingComponents, context } = this
    Object.keys(usingComponents).forEach((key) => {
      const request = usingComponents[key]
      mpx.usingComponents[key] = addQuery(request, {
        context
      })
    })
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.usingComponents)
    write(this.context)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.usingComponents = read()
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
