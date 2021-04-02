import {
  isEmptyObject, makeMap
} from '../../../helper/utils'
import MPXProxy from '../../../core/proxy'
import builtInKeysMap from '../builtInKeysMap'
import mergeOptions from '../../../core/mergeOptions'
import { LIFECYCLE } from './lifecycle'

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
    newFiled.observer = function (value, oldValue) {
      if (this.__mpxProxy) {
        this[key] = value
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
            if (context.data.hasOwnProperty(key) && validData.hasOwnProperty(key)) {
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
  // 提供代理对象需要的api
  transformApiForProxy(context, currentInject)
  // 缓存options
  context.$rawOptions = rawOptions
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
