const path = require('path')
const stringifyQuery = require('../utils/stringify-query')
const parseQuery = require('loader-utils').parseQuery
const matchCondition = require('../utils/match-condition')
const addInfix = require('../utils/add-infix')

module.exports = class AddModePlugin {
  constructor (source, mode, fileConditionRules, target) {
    this.source = source
    this.target = target
    this.mode = mode
    this.fileConditionRules = fileConditionRules
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    const mode = this.mode
    resolver.getHook(this.source).tapAsync('AddModePlugin', (request, resolveContext, callback) => {
      if (request.mode || request.env) {
        return callback()
      }
      const obj = {
        mode
      }
      const resourcePath = request.path
      const extname = path.extname(resourcePath)
      // 当前资源没有后缀名或者路径不符合fileConditionRules规则时，直接返回
      if (!extname || !matchCondition(resourcePath, this.fileConditionRules)) return callback()
      const queryObj = parseQuery(request.query || '?')
      queryObj.mode = mode
      queryObj.infix = `${queryObj.infix || ''}.${mode}`
      obj.query = stringifyQuery(queryObj)
      obj.path = addInfix(resourcePath, mode, extname)
      obj.relativePath = request.relativePath && addInfix(request.relativePath, mode, extname)
      resolver.doResolve(target, Object.assign({}, request, obj), 'add mode: ' + mode, resolveContext, callback)
    })
  }
}
