import { hasOwn, isObject, error } from '@mpxjs/utils'
import genVnodeTree from './vnode/render'
import contextMap from './vnode/context'
import { CREATED } from '../core/innerLifecycle'

function dynamicRefsMixin () {
  return {
    [CREATED] () {
      // 处理ref场景，如果是在容器组件的上下文渲染
      if (this.mpxCustomElement) {
        this._getRuntimeRefs()
      }
    },
    methods: {
      _getRuntimeRefs () {
        const vnodeContext = contextMap.get(this.uid)
        if (vnodeContext) {
          const refsArr = vnodeContext.__getRefsData && vnodeContext.__getRefsData()
          if (Array.isArray(refsArr)) {
            refsArr.forEach((ref) => {
              const all = ref.all
              if (!vnodeContext.$refs[ref.key] || (all && !vnodeContext.$refs[ref.key].length)) {
                const refNode = this.__getRefNode(ref)
                if ((all && refNode.length) || refNode) {
                  Object.defineProperty(vnodeContext.$refs, ref.key, {
                    enumerable: true,
                    configurable: true,
                    get: () => {
                      return refNode
                    }
                  })
                }
              }
            })
          }
        }
      }
    }
  }
}

function dynamicSlotMixin () {
  if (__mpx_mode__ === 'ali') {
    return {
      props: { slots: {} }
    }
  } else {
    return {
      properties: { slots: { type: Object } }
    }
  }
}

function dynamicRenderHelperMixin () {
  return {
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
}

export {
  dynamicRefsMixin,
  dynamicSlotMixin,
  dynamicRenderHelperMixin
}
