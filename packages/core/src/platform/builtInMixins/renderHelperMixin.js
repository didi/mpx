import { getByPath, hasOwn, isObject } from '@mpxjs/utils'
import genVnodeTree from '../../vnode/render'
import dynamicComponentsMap from '../../vnode/staticMap'

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
      _g (moduleId) {
        const { template = {}, styles = [] } = dynamicComponentsMap[moduleId]
        const vnodeTree = genVnodeTree(template, [this], styles, moduleId)
        return vnodeTree
      }
    }
  }
}
