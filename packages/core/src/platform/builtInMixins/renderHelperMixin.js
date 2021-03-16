import { isObject } from '../../helper/utils'
import { stringifyClass, stringifyStyle } from './stringify-wxs'

let uid = 0
const getUid = () => ++uid

// TODO: 阉割版 VNODE 之后按需优化
class VNode {
  constructor(tag, data, children, text, elm, context) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
  }
}

function simpleNormalizeChildren(children) {
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
      _i(val, handler) {
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
      _c(key, value) {
        this.__mpxProxy.renderData[key] = value
        return value
      },
      _r(vnode) {
        this.__mpxProxy.renderWithData(vnode)
      },
      // createElement
      __c(tag, data = {}, children = []) {
        if (Array.isArray(data)) {
          children = data
          data = {}
        }
        if (typeof tag === 'object') {
          return tag
        }

        children = simpleNormalizeChildren(children)

        return {
          nodeType: tag || '',
          ...data,
          nodeId: getUid(),
          children
        }
      },
      __v(content) {
        return {
          nodeType: '',
          nodeId: '',
          content
        }
      },
      __e() {
        return {
          nodeType: '',
          nodeId: '',
          content: ''
        }
      },
      __sc(...args) {
        return stringifyClass(...args)
      },
      __ss(...args) {
        return stringifyStyle(...args)
      }
    }
  }
}
