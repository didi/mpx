const path = require('path')
const stringifyQuery = require('../utils/stringify-query')
const parseRequest = require('../utils/parse-request')

module.exports = class AddModePlugin {
  constructor (source, mode, target) {
    this.source = source
    this.target = target
    this.mode = mode
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    const mode = this.mode
    resolver.getHook(this.source).tapAsync('AddModePlugin', (request, resolveContext, callback) => {
      if (request.mode) {
        return callback()
      }
      let obj = {
        mode
      }
      const parsed = parseRequest(request.request)
      const resource = parsed.resourcePath
      const queryObj = parsed.queryObj
      queryObj.mode = mode
      const resourceQuery = stringifyQuery(queryObj)
      const resourceExt = path.extname(request.request)

      obj.request = resource.substring(0, resource.length - resourceExt.length) + '.' + mode + resourceExt + resourceQuery

      resolver.doResolve(target, Object.assign({}, request, obj), 'add mode: ' + mode, resolveContext, callback)
    })
  }
}
