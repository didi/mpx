const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')


class JsonSideEffectDependency extends NullDependency {
  constructor (info = {}) {
    super()
    this.isApp = info.isApp
    this.pagesMap = info.pagesMap
    this.componentsMap = info.componentsMap
    this.entriesQueue = info.entriesQueue
  }

  get type () {
    return 'mpx inject'
  }

  mpxAction (mpx, compilation) {
    const info = this.info
    const currentPackageName = mpx.currentPackageRoot
    if (info.pagesMap) {
    }

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

JsonSideEffectDependency.Template = class JsonSideEffectDependencyTemplate {
  apply () {
  }
}

makeSerializable(JsonSideEffectDependency, '@mpxjs/webpack-plugin/lib/dependencies/JsonSideEffectDependency')

module.exports = JsonSideEffectDependency
