const { matchCondition } = require('../utils/match-condition')
const { parseQuery } = require('loader-utils')

class MpxPartialCompilePlugin {
  constructor (condition) {
    this.condition = condition
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
