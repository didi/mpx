import { getConvertRule } from '../convertor/convertor'
import builtInKeysMap from '../platform/patch/builtInKeysMap'
import { implemented } from './implement'
import {
  isObject,
  aliasReplace,
  makeMap,
  findItem,
  error,
  warn
} from '@mpxjs/utils'

let currentHooksMap = {}
let curType
let convertRule
let mpxCustomKeysMap

export default function mergeOptions (options = {}, type, needConvert) {
  // 缓存混合模式下的自定义属性列表
  mpxCustomKeysMap = makeMap(options.mpxCustomKeysForBlend || [])
  // needConvert为false，表示衔接原生的root配置，那么此时的配置都是当前原生环境支持的配置，不需要转换
  convertRule = getConvertRule(needConvert ? options.mpxConvertMode || 'default' : 'local')
  // 微信小程序使用Component创建page
  if (type === 'page' && convertRule.pageMode) {
    curType = convertRule.pageMode
  } else {
    curType = type
  }
  currentHooksMap = makeMap(convertRule.lifecycle[curType])
  const newOptions = {}
  extractMixins(newOptions, options, needConvert)
  if (needConvert) {
    proxyHooks(newOptions)
    // 自定义补充转换函数
    typeof convertRule.convert === 'function' && convertRule.convert(newOptions, type)
    // 当存在lifecycle2时，在转换后将currentHooksMap替换，以确保后续合并hooks时转换后的hooks能够被正确处理
    if (convertRule.lifecycle2) {
      const implementedHooks = convertRule.lifecycle[curType].filter((hook) => {
        return implemented[hook]
      })
      currentHooksMap = makeMap(convertRule.lifecycle2[curType].concat(implementedHooks))
    }
  }
  newOptions.mpxCustomKeysForBlend = Object.keys(mpxCustomKeysMap)
  return transformHOOKS(newOptions)
}

export function getMixin (mixin = {}) {
  // 用于ts反向推导mixin类型
  return mixin
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
  if (isObject(options.lifetimes)) {
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
      if (!Array.isArray(watch[key])) watch[key] = [watch[key]]
    } else {
      watch[key] = []
    }
    watch[key].push(config)
    extract = true
  }

  Object.keys(props).forEach(key => {
    const prop = props[key]
    if (prop && prop.observer) {
      let callback = prop.observer
      delete prop.observer
      mergeWatch(key, {
        handler (...rest) {
          if (typeof callback === 'string') {
            callback = this[callback]
          }
          typeof callback === 'function' && callback.call(this, ...rest)
        },
        deep: true,
        // 延迟触发首次回调，处理转换支付宝时在observer中查询组件的行为，如vant/picker中，如不考虑该特殊情形可用immediate代替
        // immediateAsync: true
        // 为了数据响应的标准化，不再提供immediateAsync选项，之前处理vant等原生组件跨平台转换遇到的问题推荐使用条件编译patch进行处理
        immediate: true
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
          // immediateAsync: watchProp
          // 为了数据响应的标准化，不再提供immediateAsync选项，之前处理vant等原生组件跨平台转换遇到的问题推荐使用条件编译patch进行处理
          immediate: watchProp
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
    const pageHooksMap = makeMap(convertRule.lifecycle.page)
    methods && Object.keys(methods).forEach(key => {
      if (pageHooksMap[key]) {
        if (newOptions[key]) {
          warn(`Duplicate lifecycle [${key}] is defined in root options and methods, please check.`, options.mpxFileResource)
        }
        newOptions[key] = methods[key]
        delete methods[key]
      }
    })
    return newOptions
  } else {
    return options
  }
}

function mergeMixins (parent, child) {
  for (const key in child) {
    if (currentHooksMap[key]) {
      mergeHooks(parent, child, key)
    } else if (/^(data|dataFn)$/.test(key)) {
      mergeDataFn(parent, child, key)
    } else if (/^(computed|properties|props|methods|proto|options|relations|initData)$/.test(key)) {
      mergeShallowObj(parent, child, key)
    } else if (/^(watch|observers|pageLifetimes|events)$/.test(key)) {
      mergeToArray(parent, child, key)
    } else if (/^behaviors|externalClasses$/.test(key)) {
      mergeArray(parent, child, key)
    } else if (key !== 'mixins' && key !== 'mpxCustomKeysForBlend') {
      // 收集非函数的自定义属性，在Component创建的页面中挂载到this上，模拟Page创建页面的表现，swan当中component构造器也能自动挂载自定义数据，不需要框架模拟挂载
      if (curType === 'blend' && typeof child[key] !== 'function' && !builtInKeysMap[key] && __mpx_mode__ !== 'swan') {
        mpxCustomKeysMap[key] = true
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

export function mergeShallowObj (parent, child, key) {
  let parentVal = parent[key]
  const childVal = child[key]
  if (!parentVal) {
    parent[key] = parentVal = {}
  }
  Object.assign(parentVal, childVal)
}

function mergeDataFn (parent, child, key) {
  let parentVal = parent[key]
  const childVal = child[key]

  if (typeof parentVal === 'function' && key === 'data') {
    parent.dataFn = parentVal
    delete parent.data
  }

  if (typeof childVal !== 'function') {
    mergeShallowObj(parent, child, 'data')
  } else {
    parentVal = parent.dataFn
    if (!parentVal) {
      parent.dataFn = childVal
    } else {
      parent.dataFn = function mergeFn () {
        const to = parentVal.call(this)
        const from = childVal.call(this)
        return Object.assign(to, from)
      }
    }
  }
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
      if (!Array.isArray(parent)) {
        parent = [parent]
      }
      if (!Array.isArray(child)) {
        child = [child]
      }
      parentVal[key] = parent.concat(child)
    } else {
      parentVal[key] = Array.isArray(childVal[key]) ? childVal[key] : [childVal[key]]
    }
  })
}

function composeHooks (target, includes) {
  Object.keys(target).forEach(key => {
    if (!includes || includes[key]) {
      const hooks = target[key]
      if (Array.isArray(hooks)) {
        target[key] = function (...args) {
          let result
          for (let i = 0; i < hooks.length; i++) {
            if (typeof hooks[i] === 'function') {
              const data = hooks[i].apply(this, args)
              data !== undefined && (result = data)
            }
          }
          return result
        }
      }
    }
  })
}

function proxyHooks (options) {
  const lifecycleProxyMap = convertRule.lifecycleProxyMap
  lifecycleProxyMap && Object.keys(lifecycleProxyMap).forEach(key => {
    const newHooks = (options[key] || []).slice()
    const proxyArr = lifecycleProxyMap[key]
    proxyArr && proxyArr.forEach(lifecycle => {
      if (options[lifecycle] && currentHooksMap[lifecycle]) {
        newHooks.push.apply(newHooks, options[lifecycle])
        delete options[lifecycle]
      }
    })
    newHooks.length && (options[key] = newHooks)
  })
}

function transformHOOKS (options) {
  composeHooks(options, currentHooksMap)
  options.pageLifetimes && composeHooks(options.pageLifetimes)
  options.events && composeHooks(options.events)
  if (curType === 'blend' && convertRule.support) {
    const componentHooksMap = makeMap(convertRule.lifecycle.component)
    for (const key in options) {
      // 使用Component创建page实例，页面专属生命周期&自定义方法需写在methods内部
      if (typeof options[key] === 'function' && key !== 'dataFn' && key !== 'setup' && key !== 'provide' && !componentHooksMap[key]) {
        if (!options.methods) options.methods = {}
        options.methods[key] = options[key]
        delete options[key]
      }
    }
  }
  return options
}
