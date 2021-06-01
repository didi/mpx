const path = require('path')
const parseRequest = require('../utils/parse-request')

module.exports = class AddEnvPlugin {
  constructor (source, env, target) {
    this.source = source
    this.target = target
    this.env = env
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    const env = this.env
    resolver.getHook(this.source).tapAsync('AddEnvPlugin', (request, resolveContext, callback) => {
      if (request.env) {
        return callback()
      }
      let obj = {
        env
      }

      const parsed = parseRequest(request.request)
      const resourcePath = parsed.rawResourcePath
      const resourceQuery = parsed.resourceQuery
      const resourceExt = path.extname(resourcePath)

      obj.request = resourcePath.substring(0, resourcePath.length - resourceExt.length) + '.' + env + resourceExt + resourceQuery

      resolver.doResolve(target, Object.assign({}, request, obj), 'add env: ' + env, resolveContext, callback)
    })
  }
}
