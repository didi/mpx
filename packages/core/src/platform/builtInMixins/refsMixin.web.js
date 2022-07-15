import { BEFOREMOUNT, UPDATED } from '../../core/innerLifecycle'
import { error } from '../../helper/log'
import * as webApi from '@mpxjs/api-proxy/src/web/api'

function parseSelector (selector) {
  const groups = selector.split(',')
  return groups.map((item) => {
    let id
    let ret = /#([^#.>\s]+)/.exec(item)
    if (ret) id = ret[1]

    const classes = []
    const classReg = /\.([^#.>\s]+)/g
    while (ret = classReg.exec(item)) {
      classes.push(ret[1])
    }
    return {
      id,
      classes
    }
  })
}

function matchSelector (vnode, selectorGroups) {
  let vnodeId
  let vnodeClasses = []
  if (vnode && vnode.data) {
    if (vnode.data.attrs && vnode.data.attrs.id) vnodeId = vnode.data.attrs.id
    if (vnode.data.staticClass) vnodeClasses = vnode.data.staticClass.split(/\s+/)
  }

  if (vnodeId || vnodeClasses.length) {
    for (let i = 0; i < selectorGroups.length; i++) {
      const { id, classes } = selectorGroups[i]
      if (id === vnodeId) return true
      if (classes.every((item) => vnodeClasses.includes(item))) return true
    }
  }
  return false
}

function walkChildren (vm, selectorGroups, context, result, all) {
  if (vm.$children && vm.$children.length) {
    for (let i = 0; i < vm.$children.length; i++) {
      const child = vm.$children[i]
      if (child.$vnode.context === context && !child.$options.__mpxBuiltIn) {
        if (matchSelector(child.$vnode, selectorGroups)) {
          result.push(child)
          if (!all) return
        }
      }
      walkChildren(child, selectorGroups, context, result, all)
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
        if (/[>\s]/.test(selector)) {
          const location = this.__mpxProxy.options.mpxFileResource
          error('The selectComponent or selectAllComponents only supports the basic selector, the relation selector is not supported.', location)
        } else {
          const selectorGroups = parseSelector(selector)
          walkChildren(this, selectorGroups, this, result, all)
        }
        return all ? result : result[0]
      },
      selectAllComponents (selector) {
        return this.selectComponent(selector, true)
      }
    }
  }
}
