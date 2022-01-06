const pathModule = require('path')

const normalizeCondition = (partialCompileCondition) => {
  const checkCondition = (condition, pageResourcePath) => {
    if (typeof condition === 'string') {
      return pageResourcePath.includes(condition)
    } else if (condition instanceof RegExp) {
      return condition.test(pageResourcePath)
    } else if (typeof condition === 'function') {
      return condition(pageResourcePath)
    } else if (Array.isArray(condition)) {
      for (let i = 0; i < condition.length; i++) {
        if (checkCondition(condition[i], pageResourcePath)) {
          return true
        }
      }
    }
  }
  return (pageResourcePath) => checkCondition(partialCompileCondition, pageResourcePath)
}

class MpxPartialCompilePlugin {
  constructor (partialCompileCondition) {
    this.matchCondition = normalizeCondition(partialCompileCondition)
  }

  isResolvingPage (obj) {
    const { query, path } = obj
    const extName = pathModule.extname(path)
    return (extName === '.mpx' && query.includes('resolveType=page'))
  }

  apply (compiler) {
    compiler.resolverFactory.hooks.resolver.intercept({
      factory: (type, hook) => {
        hook.tap('MpxPartialCompilePlugin', (resolver) => {
          resolver.hooks.result.tapAsync({
            name: "MpxPartialCompilePlugin",
            stage: -100
          },  (obj, resolverContext, callback) => {
            // 阻止未匹配上的页面打包
            if (this.isResolvingPage(obj) && !this.matchCondition(obj.path)) {
              obj.path = false
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
