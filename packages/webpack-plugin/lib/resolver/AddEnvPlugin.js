const path = require('path')
const stringifyQuery = require('../utils/stringify-query')
const parseQuery = require('loader-utils').parseQuery
const addInfix = require('../utils/add-infix')
const { matchCondition } = require('../utils/match-condition')
const { JSON_JS_EXT } = require('../utils/const')

module.exports = class AddEnvPlugin {
  constructor (source, env, fileConditionRules, target) {
    this.source = source
    this.target = target
    this.env = env
    this.fileConditionRules = fileConditionRules
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    const env = this.env
    const envPattern = new RegExp(`\\.${env}(\\.|$)`)

    resolver.getHook(this.source).tapAsync('AddEnvPlugin', (request, resolveContext, callback) => {
      if (request.env) {
        return callback()
      }
      const obj = {
        env
      }
      const resourcePath = request.path
      let extname = ''
      if (resourcePath.endsWith(JSON_JS_EXT)) {
        extname = JSON_JS_EXT
      } else {
        extname = path.extname(resourcePath)
      }
      // 当前资源没有后缀名或者路径不符合fileConditionRules规则时，直接返回
      if (!extname || !matchCondition(resourcePath, this.fileConditionRules)) return callback()

      const queryObj = parseQuery(request.query || '?')
      let infix = `${queryObj.infix || ''}.${env}`

      if (envPattern.test(path.basename(resourcePath))) {
        /**
         * 为解决同时存在 import 'index' / 'index.mode.env' 时
         * 产物中出现重复的 index.mode.env 与 index.mode.env?infix=.mode.env
         * 会对所有resourcePath包含.mode的模块加上infix=.mode，对所有resourcePath包含.env的模块加上infix=.env
         * 这将导致 index.env.mode（注意此处env与mode对位置不对）也会被加上infix=.mode.env（.mode总是先于.env添加上，所以一定是.mode在前）
         *
         * 所以此处需对infix进行修正，确保infix与resourcePath文件名中一致
         */
        // 如果 infix 无法与文件名匹配，则说明infix中 .env 位置不对，需要把 .env 放到最前面
        if (!path.basename(resourcePath).includes(infix)) {
          infix = `.${env}${queryObj.infix || ''}`
        }
        queryObj.infix = infix
        request.query = stringifyQuery(queryObj)
        request.env = obj.env
        return callback()
      }

      queryObj.infix = infix
      obj.query = stringifyQuery(queryObj)
      obj.path = addInfix(resourcePath, env, extname)
      obj.relativePath = request.relativePath && addInfix(request.relativePath, env, extname)

      resolver.doResolve(target, Object.assign({}, request, obj), 'add env: ' + env, resolveContext, callback)
    })
  }
}
