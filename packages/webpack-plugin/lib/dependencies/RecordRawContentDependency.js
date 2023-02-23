const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordRawContentDependency extends NullDependency {
  constructor (resourcePath, content) {
    super()
    this.resourcePath = resourcePath
    this.content = content
  }

  get type () {
    return 'mpx record raw content'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    mpx.rawContent.set(this.resourcePath, this.content)
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.resourcePath)
    write(this.content)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.resourcePath = read()
    this.content = read()
    super.deserialize(context)
  }
}

RecordRawContentDependency.Template = class RecordRawContentDependencyTemplate {
  apply () {
  }
}

makeSerializable(RecordRawContentDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordRawContentDependency')

module.exports = RecordRawContentDependency
