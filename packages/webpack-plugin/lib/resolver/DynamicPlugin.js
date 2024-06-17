const addQuery = require('../utils/add-query')
const { matchCondition } = require('../utils/match-condition')

module.exports = class DynamicPlugin {
  constructor (source, dynamicComponentRules) {
    this.source = source
    this.dynamicComponentRules = dynamicComponentRules
  }

  apply (resolver) {
    resolver.getHook(this.source).tap('DynamicPlugin', request => {
      const isDynamic = matchCondition(request.path, this.dynamicComponentRules)
      if (isDynamic) {
        request.query = addQuery(request.query, { isDynamic: true })
      }
    })
  }
}
