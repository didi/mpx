import { hasOwn, isObject, error } from '@mpxjs/utils'
import genVnodeTree from './vnode/render'
import mpx from '@mpxjs/core'

const methodMixin = {
  methods: {
    _g (astData, moduleId) {
      const location = this.__mpxProxy && this.__mpxProxy.options.mpxFileResource
      if (astData && isObject(astData) && hasOwn(astData, 'template')) {
        const vnodeTree = genVnodeTree(astData, [this], { moduleId, location })
        return vnodeTree
      } else {
        error('Dynamic component get the wrong json ast data, please check.', location, {
          errType: 'mpx-dynamic-render',
          errmsg: 'invalid json ast data'
        })
      }
    }
  }
}

function renderHelperMixin () {
  if (__mpx_mode__ === 'ali') {
    return {
      props: { slots: {} },
      ...methodMixin
    }
  } else {
    return {
      properties: { slots: { type: Object } },
      ...methodMixin
    }
  }
}

mpx.injectMixins(renderHelperMixin(), {
  types: ['component']
})
