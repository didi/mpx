import builtInKeysMap from '../builtInKeysMap'
import mergeOptions from '../../../core/mergeOptions'
import { getCurrentInstance as getCurrentVueInstance } from '../../export/index'
import MpxProxy, { setCurrentInstance, unsetCurrentInstance } from '../../../core/proxy'
import { diffAndCloneA, warn, wrapMethodsWithErrorHandling } from '@mpxjs/utils'
import { UPDATED, CREATED, MOUNTED, UNMOUNTED } from '../../../core/innerLifecycle'

function filterOptions (options) {
  const newOptions = {}
  Object.keys(options).forEach(key => {
    if (builtInKeysMap[key]) {
      return
    }
    if (key === 'data' || key === 'dataFn') {
      newOptions.data = function mergeFn () {
        return Object.assign(
          diffAndCloneA(options.data || {}).clone,
          options.dataFn && options.dataFn.call(this)
        )
      }
    } else if (key === 'methods') {
      newOptions[key] = wrapMethodsWithErrorHandling(options[key])
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
}

function initProxy (context, rawOptions) {
  if (!context.__mpxProxy) {
    // 缓存options
    context.$rawOptions = rawOptions
    // 创建proxy对象
    context.__mpxProxy = new MpxProxy(rawOptions, context)
    // todo 待问题修复后需要还原
    // context.__mpxProxy.callHook(CREATED, Hummer.pageInfo && Hummer.pageInfo.params && [Hummer.pageInfo.params])
  }
}

export function getDefaultOptions (type, { rawOptions = {}, currentInject }) {
  const rawSetup = rawOptions.setup
  if (rawSetup) {
    rawOptions.setup = (props) => {
      const { proxy: instance } = getCurrentVueInstance()
      initProxy(instance, rawOptions)
      setCurrentInstance(instance.__mpxProxy)
      const newContext = {
        triggerEvent: (eventName, eventDetail) => {
          return instance.$emit(eventName, {
            type: eventName,
            detail: eventDetail
          })
        },
        get refs () { return instance.$refs },
        forceUpdate: instance.$forceUpdate.bind(instance),
        selectComponent: () => {
          warn('selectComponent is not supported in Tenon')
        },
        selectAllComponents: () => {
          warn('selectAllComponents is not supported in Tenon')
        },
        createSelectorQuery: () => {
          warn('createSelectorQuery is not supported in Tenon')
        },
        createIntersectionObserver: () => {
          warn('createIntersectionObserver is not supported in Tenon')
        }
      }
      const setupRes = rawSetup(props, newContext)
      unsetCurrentInstance(instance.__mpxProxy)
      return setupRes
    }
  }

  const hookNames = type === 'page' ? ['onLoad', 'onReady', 'onUnload'] : ['created', 'mounted', 'unmounted']
  const rootMixins = [{
    [hookNames[0]] (...params) {
      if (!this.__mpxProxy) {
        initProxy(this, rawOptions, currentInject, params)
      }
      // todo 待问题修复后需要移除，目前逻辑是已经创建实例的情况下依旧会重复执行
      this.__mpxProxy.callHook(CREATED, Hummer.pageInfo && Hummer.pageInfo.params && [Hummer.pageInfo.params])
    },
    [hookNames[1]] () {
      this.__mpxProxy && this.__mpxProxy.callHook(MOUNTED, Hummer.pageInfo && Hummer.pageInfo.params && [Hummer.pageInfo.params])
    },
    updated () {
      this.__mpxProxy && this.__mpxProxy.callHook(UPDATED)
    },
    [hookNames[2]] () {
      this.__mpxProxy && this.__mpxProxy.callHook(UNMOUNTED)
    }
  }]
  // 为了在builtMixin中可以使用某些rootMixin实现的特性（如数据响应等），此处builtInMixin在rootMixin之后执行，但是当builtInMixin使用存在对应内建生命周期的目标平台声明周期写法时，可能会出现用户生命周期比builtInMixin中的生命周期先执行的情况，为了避免这种情况发生，builtInMixin应该尽可能使用内建生命周期来编写
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions)
}
