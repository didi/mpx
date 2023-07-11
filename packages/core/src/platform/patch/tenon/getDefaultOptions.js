import builtInKeysMap from '../builtInKeysMap'
import mergeOptions from '../../../core/mergeOptions'
import { getCurrentInstance as getCurrentVueInstance } from '../../export/index'
import MpxProxy, { setCurrentInstance, unsetCurrentInstance } from '../../../core/proxy'
import { diffAndCloneA } from '@mpxjs/utils'
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
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
}

function initProxy (context, rawOptions) {
  // 缓存options
  context.$rawOptions = rawOptions
  // 创建proxy对象
  context.__mpxProxy = new MPXProxy(rawOptions, context)
  context.__mpxProxy.callHook(CREATED, Hummer.pageInfo && Hummer.pageInfo.params && [Hummer.pageInfo.params])
}

export function getDefaultOptions (type, { rawOptions = {}, currentInject }) {

  const rawSetup = rawOptions.setup
  if (rawSetup) {
    rawOptions.setup = (props) => {
      const instance = getCurrentVueInstance().proxy
      initProxy(instance, rawOptions)
      setCurrentInstance(instance.__mpxProxy)
      const newContext = {
        triggerEvent: instance.triggerEvent.bind(instance),
        refs: instance.$refs,
        forceUpdate: instance.$forceUpdate.bind(instance),
        selectComponent: instance.selectComponent.bind(instance),
        selectAllComponents: instance.selectAllComponents.bind(instance),
        createSelectorQuery: instance.createSelectorQuery.bind(instance),
        createIntersectionObserver: instance.createIntersectionObserver.bind(instance)
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
