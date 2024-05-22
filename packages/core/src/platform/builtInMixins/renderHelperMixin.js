import { getByPath, hasOwn, isObject, error } from '@mpxjs/utils'
import genVnodeTree from '../../vnode/render'

export default function renderHelperMixin () {
  return {
    methods: {
      _i (val, handler) {
        let i, l, keys, key
        if (Array.isArray(val) || typeof val === 'string') {
          for (i = 0, l = val.length; i < l; i++) {
            handler.call(this, val[i], i)
          }
        } else if (typeof val === 'number') {
          for (i = 0; i < val; i++) {
            handler.call(this, i + 1, i)
          }
        } else if (isObject(val)) {
          keys = Object.keys(val)
          for (i = 0, l = keys.length; i < l; i++) {
            key = keys[i]
            handler.call(this, val[key], key, i)
          }
        }
      },
      // collect
      _c (key, value) {
        if (hasOwn(this.__mpxProxy.renderData, key)) {
          return this.__mpxProxy.renderData[key]
        }
        if (value === undefined) {
          value = getByPath(this, key)
        }
        this.__mpxProxy.renderData[key] = value
        return value
      },
      // simple collect
      _sc (key) {
        return (this.__mpxProxy.renderData[key] = this[key])
      },
      _r (skipPre, vnode) {
        this.__mpxProxy.renderWithData(skipPre, vnode)
      },
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
