import { hasOwn, noop, isFunction, wrapMethodsWithErrorHandling } from '@mpxjs/utils'
import MpxProxy from '../../core/proxy'
import builtInKeysMap from './builtInKeysMap'
import mergeOptions from '../../core/mergeOptions'

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
    if (isFunction(rawFiled)) {
      newFiled = {
        type: rawFiled
      }
    } else {
      newFiled = Object.assign({}, rawFiled)
    }
    // const rawObserver = rawFiled?.observer
    newFiled.observer = function (value, oldValue) {
      if (this.__mpxProxy) {
        this[key] = value
        this.__mpxProxy.propsUpdated()
      }
      // rawObserver && rawObserver.call(this, value, oldValue)
    }
    newProps[key] = newFiled
  })
  return newProps
}

function transformApiForProxy (context, currentInject) {
  const rawSetData = context.setData
  Object.defineProperties(context, {
    setData: {
      get () {
        return function (data, callback) {
          return context.__mpxProxy.forceUpdate(data, { sync: true }, callback)
        }
      },
      configurable: true
    },
    __getProps: {
      get () {
        return (options) => {
          const props = {}
          const validProps = Object.assign({}, options.properties, options.props)
          Object.keys(context.data).forEach((key) => {
            if (hasOwn(validProps, key)) {
              props[key] = context.data[key]
            }
          })
          return props
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

  // // 抹平处理tt不支持驼峰事件名的问题
  // if (__mpx_mode__ === 'tt') {
  //   const rawTriggerEvent = context.triggerEvent
  //   Object.defineProperty(context, 'triggerEvent', {
  //     get () {
  //       return function (eventName, eventDetail) {
  //         return rawTriggerEvent.call(this, eventName.toLowerCase(), eventDetail)
  //       }
  //     },
  //     configurable: true
  //   })
  // }

  // 绑定注入的render
  if (currentInject) {
    Object.defineProperties(context, {
      __injectedRender: {
        get () {
          return currentInject.render || noop
        },
        configurable: false
      }
    })
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
    if (currentInject.moduleId) {
      Object.defineProperties(context, {
        __moduleId: {
          get () {
            return currentInject.moduleId
          },
          configurable: false
        }
      })
    }
    if (currentInject.dynamic) {
      Object.defineProperties(context, {
        __dynamic: {
          get () {
            return currentInject.dynamic
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
    if (key === 'data' || key === 'initData') {
      if (!hasOwn(newOptions, 'data')) {
        newOptions.data = Object.assign({}, options.initData, options.data)
      }
    } else if (key === 'properties' || key === 'props') {
      if (!hasOwn(newOptions, 'properties')) {
        newOptions.properties = transformProperties(Object.assign({}, options.props, options.properties))
      }
    } else if (key === 'methods') {
      const newMethods = wrapMethodsWithErrorHandling(options[key])
      if (options.__pageCtor__) {
        // 构造器为Page时抽取所有methods方法到顶层
        Object.assign(newOptions, newMethods)
      } else {
        newOptions[key] = newMethods
      }
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
}

function initProxy (context, rawOptions, currentInject) {
  if (!context.__mpxProxy) {
    // 提供代理对象需要的api
    transformApiForProxy(context, currentInject)
    // 创建proxy对象
    context.__mpxProxy = new MpxProxy(rawOptions, context)
    context.__mpxProxy.created()
  } else if (context.__mpxProxy.isUnmounted()) {
    context.__mpxProxy = new MpxProxy(rawOptions, context, true)
    context.__mpxProxy.created()
  }
}

export function getDefaultOptions ({ type, rawOptions = {}, currentInject }) {
  let hookNames = ['attached', 'ready', 'detached']
  // 当用户传入page作为构造器构造页面时，修改所有关键hooks
  if (rawOptions.__pageCtor__) {
    hookNames = ['onLoad', 'onReady', 'onUnload']
  }
  const rootMixins = [{
    [hookNames[0]] () {
      initProxy(this, rawOptions, currentInject)
    },
    [hookNames[1]] () {
      if (this.__mpxProxy) this.__mpxProxy.mounted()
    },
    [hookNames[2]] () {
      if (this.__mpxProxy) this.__mpxProxy.unmounted()
    }
  }]
  // 百度环境如构造页面，优先使用onInit进行初始化
  if (__mpx_mode__ === 'swan' && type === 'page') {
    rootMixins[0].onInit = function (...params) {
      initProxy(this, rawOptions, currentInject, params)
    }
  }
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions)
}
