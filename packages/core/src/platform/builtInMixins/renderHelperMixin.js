import { isObject, isPlainObject } from '../../helper/utils'
import { stringifyClass, stringifyStyle } from '../../helper/stringify'
import contextMap from '../../vnode/context'

function simpleNormalizeChildren (children) {
  for (var i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}

export default function renderHelperMixin () {
  return {
    methods: {
      _i (val, handler) {
        let ret, i, l, keys, key
        if (Array.isArray(val) || typeof val === 'string') {
          ret = new Array(val.length)
          for (i = 0, l = val.length; i < l; i++) {
            ret[i] = handler.call(this, val[i], i)
          }
        } else if (typeof val === 'number') {
          ret = new Array(val)
          for (i = 0; i < val; i++) {
            ret[i] = handler.call(this, i + 1, i)
          }
        } else if (isObject(val)) {
          keys = Object.keys(val)
          ret = new Array(keys.length)
          for (i = 0, l = keys.length; i < l; i++) {
            key = keys[i]
            ret[i] = handler.call(this, val[key], key, i)
          }
        }

        return ret
      },
      _c (key, value) {
        this.__mpxProxy.renderData[key] = value
        return value
      },
      _r (vnode) {
        this.__mpxProxy.renderWithData(vnode)
      },
      // createElement
      __c (tag, data = {}, children = []) {
        if (Array.isArray(data)) {
          children = data
          data = {}
        }
        if (typeof tag === 'object') {
          return tag
        }

        children = simpleNormalizeChildren(children)

        // 用以渲染的 vnode 维持最小数据状态
        const vnode = {
          nodeType: tag || '',
          data,
          children
        }
        return vnode
      },
      // createTextVNode
      __v (content) {
        return {
          nodeType: '#text',
          content
        }
      },
      // createEmptyVNode
      __e () {
        return {
          nodeType: '',
          content: ''
        }
      },
      // resolveSlot
      __t (name, fallback = []) {
        // 通过 props 传递的 slots 函数
        let nodes = (this.slots && this.slots[name]) || fallback
        return nodes
      },
      __sc (...args) {
        return stringifyClass(...args)
      },
      __ss (...args) {
        return stringifyStyle(...args)
      },
      __a (tag) {
        console.log(this.__mpxProxy.target.__aliasTags)
      },
      __b (...args) {
        return args.reduce((res, arg) => {
          return isPlainObject(arg) ? Object.assign(res, arg) : res
        }, {})
      },
      _getRootContext (id) {
        return contextMap.get(id)
      }
    }
  }
}
