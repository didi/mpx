const { matchCondition } = require('../utils/match-condition')
const normalize = require('../utils/normalize')
const { parseQuery } = require('loader-utils')
const replacePageDefaultPath = normalize.lib('runtime/components/replacePageDefault.mpx')

class MpxPartialCompilePlugin {
  constructor (options) {
    this.options = options
    this.test = {
      include: options.include
    }
    this.isReplacePage = options.isReplacePage || false
  }

  isResolvingPage (obj) {
    // valid query should start with '?'
    const query = obj.query || '?'
    const parsedQuery = parseQuery(query)
    return parsedQuery.isPage || parsedQuery.resolve
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
                  aliasResourcePath = this.options.defaultPageResource || replacePageDefaultPath
                }
                if (this.options.custom) {
                  // 如果有自定义兜底路径的需求
                  let customResourcePath = this.options.custom(obj.path)
                  if (customResourcePath) {
                    aliasResourcePath = customResourcePath
                  }
                }
                if (aliasResourcePath) {
                  obj.path = aliasResourcePath
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
