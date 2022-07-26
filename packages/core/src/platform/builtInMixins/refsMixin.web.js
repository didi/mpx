import { BEFOREMOUNT, UPDATED } from '../../core/innerLifecycle'
import { error } from '../../helper/log'
import * as webApi from '@mpxjs/api-proxy/src/web/api'

function getIdentifier (vnode) {
  let identifier = ''
  if (vnode && vnode.data) {
    if (vnode.data.attrs && vnode.data.attrs.id) identifier += `#${vnode.data.attrs.id}`
    if (vnode.data.staticClass) identifier += `.${vnode.data.staticClass.split(' ').join('.')}`
  }
  return identifier
}

function walkChildren (vm, selector, context, result, all) {
  if (vm.$children && vm.$children.length) {
    for (let i = 0; i < vm.$children.length; i++) {
      const child = vm.$children[i]
      if (child.$vnode.context === context && !child.$options.__mpxBuiltIn) {
        const identifier = getIdentifier(child.$vnode)
        // todo 这里暂时只支持静态类，且只支持单个选择器，更复杂的需求建议用refs实现
        if (identifier.indexOf(selector) > -1) {
          result.push(child)
          if (!all) return
        }
      }
      walkChildren(child, selector, context, result, all)
    }
  }
}

function getEl (ref) {
  if (ref && ref.nodeType === 1) return ref
  if (ref && ref.$options && ref.$options.__mpxBuiltIn) return ref.$el
}

function processRefs (refs) {
  Object.keys(refs).forEach((key) => {
    const matched = /^__mpx_ref_([^_]+)__$/.exec(key)
    const rKey = matched && matched[1]
    if (rKey) {
      const ref = refs[key]
      if (Array.isArray(ref)) {
        if (getEl(ref[0])) {
          refs[rKey] = webApi.createSelectorQuery().in(this).selectAll(ref.map(getEl))
        } else {
          refs[rKey] = ref
        }
      } else {
        if (getEl(ref)) {
          refs[rKey] = webApi.createSelectorQuery().in(this).select(getEl(ref))
        } else {
          refs[rKey] = ref
        }
      }
    }
  })
}

export default function getRefsMixin () {
  return {
    [BEFOREMOUNT] () {
      processRefs(this.$refs || {})
    },
    [UPDATED] () {
      processRefs(this.$refs || {})
    },
    methods: {
      createSelectorQuery () {
        return webApi.createSelectorQuery().in(this)
      },
      createIntersectionObserver (component, options) {
        return webApi.createIntersectionObserver(component, options)
      },
      selectComponent (selector, all) {
        const result = []
        walkChildren(this, selector, this, result, all)
        if (selector.lastIndexOf('.') > 0) {
          const location = this.__mpxProxy && this.__mpxProxy.options.mpxFileResource
          error('The selectComponent or selectAllComponents only supports the single selector, a composed selector is not supported.', location)
        }
        return all ? result : result[0]
      },
      selectAllComponents (selector) {
        return this.selectComponent(selector, true)
      }
    }
  }
}
