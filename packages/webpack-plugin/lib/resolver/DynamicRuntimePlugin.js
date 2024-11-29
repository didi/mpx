const { matchCondition } = require('../utils/match-condition')

const matcher = {
  include: ['@mpxjs/core/src/dynamic/dynamicRenderMixin.empty.js']
}

module.exports = class DynamicRuntimePlugin {
  constructor (source, target) {
    this.source = source
    this.target = target
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    resolver.getHook(this.source).tapAsync('DynamicRuntimePlugin', (request, resolveContext, callback) => {
      const resourcePath = request.path
      if (matchCondition(resourcePath, matcher)) {
        request.path = resourcePath.replace(/\.empty/, '')
        resolver.doResolve(target, request, 'resolve dynamicRenderMixin file', resolveContext, callback)
      } else {
        callback()
      }
    })
  }
}
