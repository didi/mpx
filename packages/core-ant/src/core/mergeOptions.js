import { type, merge, extend } from '../helper/utils'
import { COMPONENT_HOOKS, PAGE_HOOKS, APP_HOOKS } from '../platform/lifecycle'

const HOOKS_MAP = {
  'component': COMPONENT_HOOKS,
  'page': PAGE_HOOKS,
  'app': APP_HOOKS
}

let CURRENT_HOOKS = []

export default function mergeOptions (options = {}, type) {
  if (!options.mixins || !options.mixins.length) return options
  CURRENT_HOOKS = HOOKS_MAP[type]
  const newOptions = {}
  extractMixins(newOptions, options)
  return transformHOOKS(newOptions)
}

function extractMixins (mergeOptions, options) {
  if (options.mixins) {
    for (const mix of options.mixins) {
      extractMixins(mergeOptions, mix)
    }
  }
  mergeMixins(mergeOptions, options)
}

function mergeMixins (parent, child) {
  for (let key in child) {
    if (CURRENT_HOOKS.indexOf(key) > -1) {
      mergeHooks(parent, child, key)
    } else if (key === 'data') {
      mergeData(parent, child, key)
    } else if (/computed|properties|methods|proto/.test(key)) {
      mergeSimpleProps(parent, child, key)
    } else if (key === 'watch') {
      mergeWatch(parent, child, key)
    } else if (key !== 'mixins') {
      mergeDefault(parent, child, key)
    }
  }
}

function mergeDefault (parent, child, key) {
  parent[key] = child[key]
}

function mergeHooks (parent, child, key) {
  if (parent.hasOwnProperty(key)) {
    parent[key].push(child[key])
  } else {
    parent[key] = [child[key]]
  }
}

function mergeSimpleProps (parent, child, key) {
  let parentVal = parent[key]
  const childVal = child[key]
  if (!parentVal) {
    parent[key] = parentVal = {}
  }
  extend(parentVal, childVal)
}

function mergeData (parent, child, key) {
  const childVal = child[key]
  if (!parent[key]) {
    parent[key] = {}
  }
  merge(parent[key], childVal)
}

function mergeWatch (parent, child, key) {
  let parentVal = parent[key]
  const childVal = child[key]
  if (!parentVal) {
    parent[key] = parentVal = {}
  }
  Object.keys(childVal).forEach(key => {
    if (key in parentVal) {
      parentVal[key] = type(parentVal[key]) !== 'Array'
        ? [parentVal[key], childVal[key]]
        : parentVal[key].concat([childVal[key]])
    } else {
      parentVal[key] = childVal[key]
    }
  })
}

function transformHOOKS (options) {
  CURRENT_HOOKS.forEach(key => {
    const hooksArr = options[key]
    hooksArr && (options[key] = function (...args) {
      let result
      for (let i = 0; i < hooksArr.length; i++) {
        if (type(hooksArr[i]) === 'Function') {
          const data = hooksArr[i].apply(this, args)
          data !== undefined && (result = data)
        }
      }
      return result
    })
  })
  return options
}
