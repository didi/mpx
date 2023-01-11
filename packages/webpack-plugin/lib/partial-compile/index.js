const { matchCondition } = require('../utils/match-condition')
const addQuery  = require('../utils/add-query')
const { parseQuery } = require('loader-utils')

class MpxPartialCompilePlugin {
  constructor (options) {
    this.options = options
    this.test = options.test
    this.isReplacePage = options.isReplacePage || false
    this.keepOriginalPath = options.keepOriginalPath || true
  }

  isResolvingPage (obj) {
    // valid query should start with '?'
    const query = obj.query || '?'
    return parseQuery(query).isPage
  }

  apply (compiler) {
    compiler.resolverFactory.hooks.resolver.intercept({
      factory: (type, hook) => {
        hook.tap('MpxPartialCompilePlugin', (resolver) => {
          resolver.hooks.result.tapAsync({
            name: 'MpxPartialCompilePlugin',
            stage: -100
          }, (obj, resolverContext, callback) => {
            if (this.isResolvingPage(obj)) {
              if (this.isReplacePage) {
                let aliasResourcePath = null
                if (matchCondition(obj.path, this.test)) {
                  aliasResourcePath = this.options.defaultPageResource || '框架内置资源'
                }
                // 页面替换
                if (this.options.custom) {
                  // 如果有自定义兜底路径的需求
                  let customResourcePath = this.options.custom(obj.path)
                  if (customResourcePath && '判断资源路径是否可索引') {
                    aliasResourcePath = customResourcePath
                  }
                }
                if (aliasResourcePath) {
                  // obj.path = aliasResourcePath
                  obj.path = addQuery(obj.path + obj.query, {aliasResourcePath, keepOriginalPath: this.keepOriginalPath})
                }
              } else {
                // 局部编译
                if (!matchCondition(obj.path, this.test)) {
                  obj.path = false
                }
              }
            }
            callback(null, obj)
          })
        })
        return hook
      }
    })
  }
}

module.exports = MpxPartialCompilePlugin
