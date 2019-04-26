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

      let temp = request.path
      let ext = path.extname(temp)
      obj.path = temp.substring(0, temp.length - ext.length) + '.' + mode + ext

      let queryObj = parseQuery(request.query || '?')
      queryObj.mode = mode
      obj.query = stringifyQuery(queryObj)

      if (request.relativePath) {
        temp = request.relativePath
        obj.relativePath = temp.substring(0, temp.length - ext.length) + '.' + mode + ext
      }

      resolver.doResolve(target, Object.assign({}, request, obj), 'add mode: ' + mode, resolveContext, callback)
    })
  }
}
