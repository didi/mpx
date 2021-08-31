const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const async = require('async')
const EntryPlugin = require('webpack/lib/EntryPlugin')

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

  mpxAction (mpx, compilation, callback) {
    const info = this.info
    const compiler = compilation.compiler
    const packageName = mpx.currentPackageRoot || 'main'
    const componentsMap = mpx.componentsMap[packageName] = mpx.componentsMap[packageName] || {}
    Object.assign(mpx.pagesMap, info.pagesMap)
    Object.assign(componentsMap, info.componentsMap)
    if (this.entriesQueue) {
      async.series(this.entriesQueue.map((info) => {
        const entries = info.entries
        const root = mpx.currentPackageRoot = info.root
        mpx.componentsMap[root] = {}
        mpx.staticResourcesMap[root] = {}
        mpx.subpackageModulesMap[root] = {}
        return (callback) => {
          async.parallel(entries.map(({ resource, name }) => {
            // const type = entry.type
            return (callback) => {
              const dep = EntryPlugin.createDependency(resource, { name })
              compilation.addEntry(compiler.context, dep, { name }, (err, module) => {
                callback(err, module)
              })
            }
          }), callback)
        }
      }), callback)
    } else {
      callback()
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
