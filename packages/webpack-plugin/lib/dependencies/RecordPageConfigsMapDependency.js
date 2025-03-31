const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const isEmptyObject = require('../utils/is-empty-object')

class RecordPageConfigMapDependency extends NullDependency {
  constructor (resourcePath, jsonObj) {
    super()
    this.resourcePath = resourcePath || ''
    this.jsonObj = jsonObj || {}
  }

  get type () {
    return 'mpx record pageConfigsMap'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const pagePath = mpx.pagesMap[this.resourcePath]
    if (!isEmptyObject(this.jsonObj)) mpx.pageConfigsMap[pagePath] = this.jsonObj
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.resourcePath)
    write(this.jsonObj)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.pagePath = read()
    this.jsonObj = read()
    super.deserialize(context)
  }
}

RecordPageConfigMapDependency.Template = class RecordPageConfigMapDependencyTemplate {
  apply () {
  }
}

makeSerializable(RecordPageConfigMapDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordPageConfigMapDependency')

module.exports = RecordPageConfigMapDependency
