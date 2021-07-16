import {
  isEmptyObject, makeMap, hasOwn
} from '../../../helper/utils'
import MPXProxy from '../../../core/proxy'
import builtInKeysMap from '../builtInKeysMap'
import mergeOptions from '../../../core/mergeOptions'
import { LIFECYCLE } from './lifecycle'
import contextMap from '../../../vnode/context'

function transformProperties (properties) {
  if (!properties) {
    return {}
  }
  const newProps = {}
  Object.keys(properties).forEach(key => {
    let rawFiled = properties[key]
    let newFiled = null
    if (rawFiled === null) {
      rawFiled = {
        type: null
      }
    }
    if (typeof rawFiled === 'function') {
      newFiled = {
        type: rawFiled
      }
    } else {
      newFiled = Object.assign({}, rawFiled)
    }
    // wx 挂载 observer 监听
    newFiled.observer = function (value, oldValue) {
      if (this.__mpxProxy) {
        this[key] = value // 修改对应响应式数据值
        this.__mpxProxy.updated()
      }
    }
    newProps[key] = newFiled
  })
  return newProps
}

function transformApiForProxy (context, currentInject) {
  const rawSetData = context.setData.bind(context)
  Object.defineProperties(context, {
    setData: {
      get () {
        return function (data, callback) {
          return this.__mpxProxy.forceUpdate(data, { sync: true }, callback)
        }
      },
      configurable: true
    },
    __getInitialData: {
      get () {
        return (options) => {
          const data = {}
          const validData = Object.assign({}, options.data, options.properties, options.props)
          for (const key in context.data) {
            if (hasOwn(context.data, key) && hasOwn(validData, key)) {
              data[key] = context.data[key]
            }
          }
          return data
        }
      },
      configurable: false
    },
    __render: {
      get () {
        return rawSetData
      },
      configurable: false
    }
  })
  // 绑定注入的render
  if (currentInject) {
    if (currentInject.render) {
      Object.defineProperties(context, {
        __injectedRender: {
          get () {
            return currentInject.render.bind(context)
          },
          configurable: false
        }
      })
    }
    if (currentInject.getRefsData) {
      Object.defineProperties(context, {
        __getRefsData: {
          get () {
            return currentInject.getRefsData
          },
          configurable: false
        }
      })
    }
    if (currentInject.runtimeSlots) {
      Object.defineProperties(context, {
        __getRuntimeSlots: {
          get () {
            return currentInject.runtimeSlots
          },
          configurable: false
        }
      })
    }
    if (currentInject.aliasTags) {
      Object.defineProperties(context, {
        __aliasTags: {
          get () {
            return currentInject.aliasTags
          },
          configurable: false
        }
      })
    }
    if (currentInject.moduleId) {
      contextMap.set(currentInject.moduleId, context)
    }
  }
}

function filterOptions (options) {
  const newOptions = {}
  Object.keys(options).forEach(key => {
    if (builtInKeysMap[key]) {
      return
    }
    if (key === 'properties' || key === 'props') {
      newOptions.properties = transformProperties(Object.assign({}, options.properties, options.props))
    } else if (key === 'methods' && options.__pageCtor__) {
      // 构造器为Page时抽取所有methods方法到顶层
      Object.assign(newOptions, options[key])
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
}

function getRootMixins (mixin) {
  const supportBehavior = typeof Behavior !== 'undefined'
  const rootMixins = []
  if (supportBehavior) {
    const behavior = {}
    const pageHooksMap = makeMap(LIFECYCLE.PAGE_HOOKS)
    Object.keys(mixin).forEach((key) => {
      // 除页面生命周期之外使用behaviors进行mixin
      if (!pageHooksMap[key]) {
        behavior[key] = mixin[key]
        delete mixin[key]
      }
    })
    if (!isEmptyObject(behavior)) {
      rootMixins.push({
        // eslint-disable-next-line no-undef
        behaviors: [Behavior(behavior)]
      })
    }
  }
  rootMixins.push(mixin)
  return rootMixins
}

function initProxy (context, rawOptions, currentInject) {
  // 提供代理对象需要的api (微信小程序 this 实例上相关 api 的代理)
  transformApiForProxy(context, currentInject)
  // 缓存options
  context.$rawOptions = rawOptions
  if (context.__getRuntimeSlots) {
    if (!rawOptions.computed) {
      rawOptions.computed = {}
    }
    rawOptions.computed.runtimeSlots = context.__getRuntimeSlots
  }
  // 创建proxy对象
  const mpxProxy = new MPXProxy(rawOptions, context)
  context.__mpxProxy = mpxProxy
  context.__mpxProxy.created()
}

export function getDefaultOptions (type, { rawOptions = {}, currentInject }) {
  const hookNames = ['attached', 'ready', 'detached']
  // 当用户传入page作为构造器构造页面时，修改所有关键hooks
  if (rawOptions.__pageCtor__) {
    hookNames[0] = 'onLoad'
    hookNames[1] = 'onReady'
    hookNames[2] = 'onUnload'
  }
  const rootMixins = getRootMixins({
    [hookNames[0]] () {
      if (!this.__mpxProxy) {
        initProxy(this, rawOptions, currentInject)
      }
    },
    [hookNames[1]] () {
      this.__mpxProxy && this.__mpxProxy.mounted()
    },
    [hookNames[2]] () {
      this.__mpxProxy && this.__mpxProxy.destroyed()
    }
  })
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions)
}
