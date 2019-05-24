const path = require('path')
const parseQuery = require('loader-utils').parseQuery
const stringifyQuery = require('../utils/stringify-query')

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

      let resource = request.request
      const queryIndex = resource.indexOf('?')
      let resourceQuery = '?'
      if (queryIndex > -1) {
        resourceQuery = resource.substr(queryIndex)
        resource = resource.substr(0, queryIndex)
      }
      const resourceExt = path.extname(resource)

      const resourceQueryObj = parseQuery(resourceQuery)
      resourceQueryObj.mode = mode
      resourceQuery = stringifyQuery(resourceQueryObj)

      obj.request = resource.substring(0, resource.length - resourceExt.length) + '.' + mode + resourceExt + resourceQuery

      resolver.doResolve(target, Object.assign({}, request, obj), 'add mode: ' + mode, resolveContext, callback)
    })
  }
}
