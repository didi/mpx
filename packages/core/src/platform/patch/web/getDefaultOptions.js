import builtInKeysMap from '../builtInKeysMap'
import mergeOptions from '../../../core/mergeOptions'
import { diffAndCloneA } from '../../../helper/utils'
import { getCurrentInstance as getVueCurrentInstance } from '../../export/index'
import MpxProxy, { setCurrentInstance, unsetCurrentInstance } from '../../../core/proxy'

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
  if (!context.__mpxProxy) {
    // 创建proxy对象
    context.__mpxProxy = new MpxProxy(rawOptions, context)
    // proxy上挂载当前vue实例，在调用created的时候可以通过该实例拿到注册到实例上的hooks钩子供调用
    // context.__mpxProxy.vueInstance = context
    context.__mpxProxy.created()
  } else if (context.__mpxProxy.isUnmounted()) {
    context.__mpxProxy = new MpxProxy(rawOptions, context, true)
    context.__mpxProxy.created()
  }
}

export function getDefaultOptions (type, { rawOptions = {} }) {
  const rawSetup = rawOptions.setup
  let instance = null
  if (rawSetup) {
    rawOptions.setup = (props, context) => {
      instance = getVueCurrentInstance().proxy
      instance.__mpxProxy = new MpxProxy(rawOptions, instance)
      setCurrentInstance(instance.__mpxProxy)
      const newContext = {
        triggerEvent: instance.triggerEvent.bind(instance),
        createSelectorQuery: instance.createSelectorQuery.bind(instance),
        selectComponent: instance.selectComponent.bind(instance),
        selectAllComponents: instance.selectAllComponents.bind(instance)
      }
      const setupRes = rawSetup(props, newContext)
      unsetCurrentInstance(instance.__mpxProxy)
      return setupRes
    }
  }
  const rootMixins = [{
    created () {
      // 因setup是在created之前执行, 注册生命周期钩子时需要mpxProxy已经实例化
      if (rawSetup) {
        instance.__mpxProxy.created()
      } else {
        initProxy(this, rawOptions)
      }
    },
    mounted () {
      if (this.__mpxProxy) this.__mpxProxy.mounted()
    },
    beforeUpdate () {
      if (this.__mpxProxy) this.__mpxProxy.beforeUpdate()
    },
    updated () {
      if (this.__mpxProxy) this.__mpxProxy.updated()
    },
    destroyed () {
      if (this.__mpxProxy) this.__mpxProxy.unmounted()
    }
  }]
  // 为了在builtMixin中可以使用某些rootMixin实现的特性（如数据响应等），此处builtInMixin在rootMixin之后执行，但是当builtInMixin使用存在对应内建生命周期的目标平台声明周期写法时，可能会出现用户生命周期比builtInMixin中的生命周期先执行的情况，为了避免这种情况发生，builtInMixin应该尽可能使用内建生命周期来编写
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions)
}
