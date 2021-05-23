const path = require('path')
const stringifyQuery = require('@mpxjs/webpack-plugin/lib/utils/stringify-query')
const parseRequest = require('@mpxjs/webpack-plugin/lib/utils/parse-request')

module.exports = class AddModePlugin {
  constructor (source, env, target) {
    this.source = source
    this.target = target
    this.env = env
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    const env = this.env
    resolver.getHook(this.source).tapAsync('AddModePlugin', (request, resolveContext, callback) => {
      if (request.env) {
        return callback()
      }
      let obj = {
        env
      }
      const parsed = parseRequest(request.request)
      const resourcePath = parsed.rawResourcePath
      const queryObj = parsed.queryObj
      const resourceQuery = stringifyQuery(queryObj)
      const resourceExt = path.extname(resourcePath)

      obj.request = resourcePath.substring(0, resourcePath.length - resourceExt.length) + '.' + env + resourceExt + resourceQuery

      resolver.doResolve(target, Object.assign({}, request, obj), 'add env: ' + env, resolveContext, callback)
    })
  }
}
