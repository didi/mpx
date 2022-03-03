const pathModule = require('path')
const matchCondition = require('../utils/match-condition')

class MpxPartialCompilePlugin {
  constructor (condition) {
    this.condition = condition
  }

  isResolvingPage (obj) {
    const { query, path } = obj
    const extName = pathModule.extname(path)
    return (extName === '.mpx' && query.includes('isPage'))
  }

  apply (compiler) {
    compiler.resolverFactory.hooks.resolver.intercept({
      factory: (type, hook) => {
        hook.tap('MpxPartialCompilePlugin', (resolver) => {
          resolver.hooks.result.tapAsync({
            name: "MpxPartialCompilePlugin",
            stage: -100
          },  (obj, resolverContext, callback) => {
            if (this.isResolvingPage(obj) && !matchCondition(obj.path, this.condition)) {
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
