const path = require('path')
const { matchCondition } = require('../utils/match-condition')
const addInfix = require('../utils/add-infix')

const matcher = {
  include: ['@mpxjs/core/src/dynamic/dynamicRenderMixin.js']
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
      const extname = path.extname(resourcePath)
      if (matchCondition(resourcePath, matcher)) {
        request.path = addInfix(request.path, 'empty', extname)
        resolver.doResolve(target, request, 'resolve dynamicRenderMixin empty file', resolveContext, callback)
      } else {
        callback()
      }
    })
  }
}
