const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const addQuery = require('../utils/add-query')
const isUrlRequest = require('../utils/is-url-request')

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
    const resolver = compilation.resolverFactory.get('normal', module.resolveOptions)
    Object.keys(usingComponents).forEach((key) => {
      const request = usingComponents[key]
      if (!isUrlRequest(request, mpx.projectRoot)) {
        mpx.globalComponentsInfo[key] = {
          mid: mpx.getModuleId(request, false)
        }
      } else {
        resolver.resolve({}, this.context, request, {}, (err, resource) => {
          if (err) return
          mpx.globalComponentsInfo[key] = {
            mid: mpx.getModuleId(resource, false)
          }
        })
      }

      mpx.globalComponents[key] = addQuery(request, {
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
