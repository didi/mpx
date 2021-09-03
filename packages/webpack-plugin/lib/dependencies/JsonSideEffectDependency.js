const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const async = require('async')


class JsonSideEffectDependency extends NullDependency {
  constructor (info = {}) {
    super()
    this.appInfo = info.appInfo
    this.pagesMap = info.pagesMap
    this.componentsMap = info.componentsMap
    this.staticResourcesMap = info.staticResourcesMap
    this.entries = info.entries
    this.subpackageEntriesMap = info.subpackageEntriesMap
  }

  get type () {
    return 'mpx json sideEffect'
  }

  mpxAction (mpx, compilation, callback) {
    Object.assign(mpx.pagesMap, this.pagesMap)
    Object.keys(this.componentsMap).forEach((packageName) => {
      mpx.componentsMap[packageName] = mpx.componentsMap[packageName] || {}
      Object.assign(mpx.componentsMap[packageName], this.componentsMap[packageName])
    })
    Object.keys(this.staticResourcesMap).forEach((packageName) => {
      mpx.staticResourcesMap[packageName] = mpx.staticResourcesMap[packageName] || {}
      Object.assign(mpx.staticResourcesMap[packageName], this.staticResourcesMap[packageName])
    })

    if (this.appInfo) {
      mpx.appInfo = this.appInfo
    }

    if (this.subpackageEntriesMap) {
      mpx.subpackageEntriesMap = this.subpackageEntriesMap
    }

    async.each(this.entries, ({ resource, name }, callback) => {
      mpx.addEntry(entry, callback)
    }, callback)
  }

  serialize (context) {
    const { write } = context
    write(this.appInfo)
    write(this.pagesMap)
    write(this.componentsMap)
    write(this.staticResourcesMap)
    write(this.entries)
    write(this.subpackageEntriesMap)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.appInfo = read()
    this.pagesMap = read()
    this.componentsMap = read()
    this.staticResourcesMap = read()
    this.entries = read()
    this.subpackageEntriesMap = read()
    super.deserialize(context)
  }
}

JsonSideEffectDependency.Template = class JsonSideEffectDependencyTemplate {
  apply () {
  }
}

makeSerializable(JsonSideEffectDependency, '@mpxjs/webpack-plugin/lib/dependencies/JsonSideEffectDependency')

module.exports = JsonSideEffectDependency
