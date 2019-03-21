import { type, merge, extend } from '../helper/utils'
import { getConvertRule } from '../convertor/convertor'

let CURRENT_HOOKS = []
let curType
let convertRule

export default function mergeOptions (options = {}, type, needProxyLifecycle = true) {
  convertRule = getConvertRule(options.mpxConvertMode || 'default')
  // 微信小程序使用Component创建page
  curType = type === 'app' || !convertRule.mode ? type : convertRule.mode
  CURRENT_HOOKS = convertRule.lifecycle[curType]
  const newOptions = {}
  extractMixins(newOptions, options)
  needProxyLifecycle && proxyHooks(newOptions)
  // 自定义补充转换函数
  typeof convertRule.convert === 'function' && convertRule.convert(newOptions)
  return transformHOOKS(newOptions)
}

function extractMixins (mergeOptions, options) {
  if (options.mixins) {
    for (const mix of options.mixins) {
      extractMixins(mergeOptions, mix)
    }
  }
  options = extractLifetimes(options)
  options = extractPageHooks(options)
  mergeMixins(mergeOptions, options)
}

function extractLifetimes (options) {
  if (type(options.lifetimes) === 'Object') {
    const newOptions = extend({}, options, options.lifetimes)
    delete newOptions.lifetimes
    return newOptions
  } else {
    return options
  }
}

function extractPageHooks (options) {
  if (curType === 'blend') {
    const newOptions = extend({}, options)
    const methods = newOptions.methods
    const PAGE_HOOKS = convertRule.lifecycle.page
    methods && Object.keys(methods).forEach(key => {
      if (PAGE_HOOKS.indexOf(key) > -1) {
        if (newOptions[key]) {
          console.warn(`Don't redefine the lifecycle [${key}]， it will use the methods's lifecycle if redefined`)
        }
        newOptions[key] = methods[key]
      }
    })
    return newOptions
  } else {
    return options
  }
}

function mergeMixins (parent, child) {
  for (let key in child) {
    if (CURRENT_HOOKS.indexOf(key) > -1) {
      mergeHooks(parent, child, key)
    } else if (key === 'data') {
      mergeDataFn(parent, child, key)
    } else if (/computed|properties|props|methods|proto/.test(key)) {
      mergeSimpleProps(parent, child, key)
    } else if (/watch|pageLifetimes/.test(key)) {
      mergeToArray(parent, child, key)
    } else if (key !== 'mixins') {
      mergeDefault(parent, child, key)
    }
  }
}

function mergeDefault (parent, child, key) {
  parent[key] = child[key]
}

function mergeHooks (parent, child, key) {
  if (parent[key]) {
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

function mergeDataFn (parent, child, key) {
  const parentVal = parent[key]
  const childVal = child[key]
  if (!parentVal) {
    if (typeof childVal === 'function') {
      parent[key] = childVal
    } else {
      parent[key] = {}
      merge(parent[key], childVal)
    }
  } else if (typeof parentVal !== 'function' && typeof childVal !== 'function') {
    mergeData(parent, child, key)
  } else {
    parent[key] = function mergeFn () {
      return merge(
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal,
        typeof childVal === 'function' ? childVal.call(this, this) : childVal
      )
    }
  }
}

function mergeData (parent, child, key) {
  const childVal = child[key]
  if (!parent[key]) {
    parent[key] = {}
  }
  merge(parent[key], childVal)
}

function mergeToArray (parent, child, key) {
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
      parentVal[key] = [childVal[key]]
    }
  })
}

function composeHooks (target, includes) {
  Object.keys(target).forEach(key => {
    if (!includes || includes.indexOf(key) !== -1) {
      const hooksArr = target[key]
      hooksArr && (target[key] = function (...args) {
        let result
        for (let i = 0; i < hooksArr.length; i++) {
          if (type(hooksArr[i]) === 'Function') {
            const data = hooksArr[i].apply(this, args)
            data !== undefined && (result = data)
          }
          if (result === '__abort__') {
            break
          }
        }
        return result
      })
    }
  })
}

function proxyHooks (options) {
  const lifecycleProxyMap = convertRule.lifecycleProxyMap
  lifecycleProxyMap && Object.keys(lifecycleProxyMap).forEach(key => {
    const newHooks = (options[key] || []).slice()
    const proxyArr = lifecycleProxyMap[key]
    proxyArr && proxyArr.forEach(lifecycle => {
      if (CURRENT_HOOKS.indexOf(lifecycle) !== -1) {
        newHooks.push.apply(newHooks, options[lifecycle])
        delete options[lifecycle]
      }
    })
    newHooks.length && (options[key] = newHooks)
  })
}

function transformHOOKS (options) {
  composeHooks(options, CURRENT_HOOKS)
  options.pageLifetimes && composeHooks(options.pageLifetimes)
  if (curType === 'blend' && convertRule.support) {
    const COMPONENT_HOOKS = convertRule.lifecycle.component
    for (const key in options) {
      // 使用Component创建page实例，页面专属生命周期&自定义方法需写在methods内部
      if (typeof options[key] === 'function' && key !== 'data' && COMPONENT_HOOKS.indexOf(key) === -1) {
        (options.methods || (options.methods = {}))[key] = options[key]
        delete options[key]
      }
    }
  }
  return options
}
