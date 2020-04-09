import { type, isPlainObject, merge, aliasReplace, findItem, diffAndCloneA } from '../helper/utils'
import { getConvertRule } from '../convertor/convertor'
import { error, warn } from '../helper/log'

let CURRENT_HOOKS = []
let curType
let convertRule
let mpxCustomKeysForBlend

export default function mergeOptions (options = {}, type, needConvert = true) {
  // 缓存混合模式下的自定义属性列表
  mpxCustomKeysForBlend = options.mpxCustomKeysForBlend || []
  // needConvert为false，表示衔接原生的root配置，那么此时的配置都是当前原生环境支持的配置，不需要转换
  convertRule = getConvertRule(needConvert ? options.mpxConvertMode || 'default' : 'local')
  // 微信小程序使用Component创建page
  if (type === 'page' && convertRule.pageMode) {
    curType = convertRule.pageMode
  } else {
    curType = type
  }
  CURRENT_HOOKS = convertRule.lifecycle[curType]
  const newOptions = {}
  extractMixins(newOptions, options, needConvert)
  if (needConvert) {
    proxyHooks(newOptions)
    // 自定义补充转换函数
    typeof convertRule.convert === 'function' && convertRule.convert(newOptions)
    // 当存在lifecycle2时，在转换后将CURRENT_HOOKS替换，以确保后续合并hooks时转换后的hooks能够被正确处理
    if (convertRule.lifecycle2) {
      CURRENT_HOOKS = convertRule.lifecycle2[curType]
    }
  }

  newOptions.mpxCustomKeysForBlend = mpxCustomKeysForBlend
  return transformHOOKS(newOptions)
}

export function getMixin (mixin = {}) {
  // 用于ts反向推导mixin类型
  return mixin.mixins ? extractMixins({}, mixin, true) : mixin
}

function extractMixins (mergeOptions, options, needConvert) {
  // 如果编译阶段behaviors都被当做mixins处理，那么进行别名替换
  if (options.behaviors && options.behaviors[0] && options.behaviors[0].__mpx_behaviors_to_mixins__) {
    aliasReplace(options, 'behaviors', 'mixins')
  }
  if (options.mixins) {
    for (const mixin of options.mixins) {
      if (typeof mixin === 'string') {
        error('String-formatted builtin behaviors is not supported to be converted to mixins.', options.mpxFileResource)
      } else {
        extractMixins(mergeOptions, mixin, needConvert)
      }
    }
  }
  // 出于业务兼容考虑暂时不移除pageShow/pageHide
  // options = extractPageShow(options)
  options = extractLifetimes(options)
  options = extractPageHooks(options)
  if (needConvert) {
    options = extractObservers(options)
  }
  mergeMixins(mergeOptions, options)
  return mergeOptions
}

// function extractPageShow (options) {
//   if (options.pageShow || options.pageHide) {
//     const mixin = {
//       pageLifetimes: {}
//     }
//     if (options.pageShow) {
//       mixin.pageLifetimes.show = options.pageShow
//       delete options.pageShow
//     }
//     if (options.pageHide) {
//       mixin.pageLifetimes.hide = options.pageHide
//       delete options.pageHide
//     }
//     mergeToArray(options, mixin, 'pageLifetimes')
//   }
//   return options
// }

function extractLifetimes (options) {
  if (isPlainObject(options.lifetimes)) {
    const newOptions = Object.assign({}, options, options.lifetimes)
    delete newOptions.lifetimes
    return newOptions
  } else {
    return options
  }
}

function extractObservers (options) {
  const observers = options.observers
  const props = Object.assign({}, options.properties, options.props)
  const watch = Object.assign({}, options.watch)
  let extract = false

  function mergeWatch (key, config) {
    if (watch[key]) {
      type(watch[key]) !== 'Array' && (watch[key] = [watch[key]])
    } else {
      watch[key] = []
    }
    watch[key].push(config)
    extract = true
  }

  Object.keys(props).forEach(key => {
    const prop = props[key]
    if (prop && prop.observer) {
      mergeWatch(key, {
        handler (...rest) {
          let callback = prop.observer
          if (typeof callback === 'string') {
            callback = this[callback]
          }
          typeof callback === 'function' && callback.call(this, ...rest)
        },
        deep: true,
        // 延迟触发首次回调，处理转换支付宝时在observer中查询组件的行为，如vant/picker中，如不考虑该特殊情形可用immediate代替
        immediateAsync: true
      })
    }
  })
  if (observers) {
    Object.keys(observers).forEach(key => {
      const callback = observers[key]
      if (callback) {
        let deep = false
        const propsArr = Object.keys(props)
        const keyPathArr = []
        key.split(',').forEach(item => {
          const result = item.trim()
          result && keyPathArr.push(result)
        })
        // 针对prop的watch都需要立刻执行一次
        let watchProp = false
        for (const prop of propsArr) {
          if (findItem(keyPathArr, prop)) {
            watchProp = true
            break
          }
        }
        if (key.indexOf('.**') > -1) {
          deep = true
          key = key.replace('.**', '')
        }
        mergeWatch(key, {
          handler (val, old) {
            let cb = callback
            if (typeof cb === 'string') {
              cb = this[cb]
            }
            if (typeof cb === 'function') {
              if (keyPathArr.length < 2) {
                val = [val]
                old = [old]
              }
              cb.call(this, ...val, ...old)
            }
          },
          deep,
          immediateAsync: watchProp
        })
      }
    })
  }
  if (extract) {
    const newOptions = Object.assign({}, options)
    newOptions.watch = watch
    delete newOptions.observers
    return newOptions
  }
  return options
}

function extractPageHooks (options) {
  if (curType === 'blend') {
    const newOptions = Object.assign({}, options)
    const methods = newOptions.methods
    const PAGE_HOOKS = convertRule.lifecycle.page
    methods && Object.keys(methods).forEach(key => {
      if (PAGE_HOOKS.indexOf(key) > -1) {
        if (newOptions[key]) {
          warn(`Duplicate lifecycle [${key}] is defined in root options and methods, please check.`, options.mpxFileResource)
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
    } else if (/^(computed|properties|props|methods|proto)$/.test(key)) {
      mergeSimpleProps(parent, child, key)
    } else if (/^(watch|pageLifetimes|observers|events)$/.test(key)) {
      mergeToArray(parent, child, key)
    } else if (/^behaviors$/.test(key)) {
      mergeArray(parent, child, key)
    } else if (key !== 'mixins' && key !== 'mpxCustomKeysForBlend') {
      if (curType === 'blend' && typeof child[key] !== 'function' && mpxCustomKeysForBlend.indexOf(key) === -1) {
        mpxCustomKeysForBlend.push(key)
      }
      mergeDefault(parent, child, key)
    }
  }
}

export function mergeDefault (parent, child, key) {
  parent[key] = child[key]
}

export function mergeHooks (parent, child, key) {
  if (parent[key]) {
    parent[key].push(child[key])
  } else {
    parent[key] = [child[key]]
  }
}

export function mergeSimpleProps (parent, child, key) {
  let parentVal = parent[key]
  const childVal = child[key]
  if (!parentVal) {
    parent[key] = parentVal = {}
  }
  Object.assign(parentVal, childVal)
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
        typeof parentVal === 'function' ? parentVal.call(this) : diffAndCloneA(parentVal).clone,
        typeof childVal === 'function' ? childVal.call(this) : diffAndCloneA(childVal).clone
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

export function mergeArray (parent, child, key) {
  const childVal = child[key]
  if (!parent[key]) {
    parent[key] = []
  }
  parent[key] = parent[key].concat(childVal)
}

export function mergeToArray (parent, child, key) {
  let parentVal = parent[key]
  const childVal = child[key]
  if (!parentVal) {
    parent[key] = parentVal = {}
  }
  Object.keys(childVal).forEach(key => {
    if (key in parentVal) {
      let parent = parentVal[key]
      let child = childVal[key]
      if (type(parent) !== 'Array') {
        parent = [parent]
      }
      if (type(child) !== 'Array') {
        child = [child]
      }
      parentVal[key] = parent.concat(child)
    } else {
      parentVal[key] = type(childVal[key]) === 'Array' ? childVal[key] : [childVal[key]]
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
      if (options[lifecycle] && CURRENT_HOOKS.indexOf(lifecycle) !== -1) {
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
  options.events && composeHooks(options.events)
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
