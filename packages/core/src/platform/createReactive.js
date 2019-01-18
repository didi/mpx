import {
  proxy,
  deleteProperties,
  enumerableKeys,
  extend,
  processRenderData
} from '../helper/utils'

import { mergeInjectedMixins } from '../core/injectMixins'
import mergeOptions from '../core/mergeOptions'
import getBuiltInMixins from './builtInMixins/index'
import MPXProxy from '../core/proxy'
import CustomKeys from '../core/customOptionKeys'

function getReactiveMixin (options = {}, currentInject) {
  return {
    created () {
      // 提供代理对象需要的api
      transformApiForProxy(this, currentInject)
      // 缓存options
      this.$rawOptions = options
      // 挂载原型属性到实例上
      proxy(this, options.proto, enumerableKeys(options.proto), true)
      // 创建proxy对象
      const mpxProxy = new MPXProxy(options, this)
      this.$mpxProxy = mpxProxy
      // 挂载$watch
      this.$watch = (...rest) => mpxProxy.watch(...rest)
      // 挂载设置组件当次更新后执行的回调
      this.$updated = (...rest) => mpxProxy.updated(...rest)
      // 强制执行render
      this.$forceUpdate = (...rest) => mpxProxy.forceUpdate(...rest)
    },
    attached () {
      // 组件监听视图数据更新, attached之后才能拿到properties
      this.$mpxProxy.watchRender()
    },
    detached () {
      this.$mpxProxy.clearWatchers()
    }
  }
}

function transformProperties (properties) {
  const newProps = {}
  enumerableKeys(properties).forEach(key => {
    const rawFiled = properties[key]
    const rawObserver = rawFiled.observer
    let newFiled = null
    if (typeof rawFiled === 'function') {
      newFiled = {
        type: rawFiled
      }
    } else {
      newFiled = extend({}, rawFiled)
    }
    newFiled.observer = function (value, oldValue) {
      this[key] = value
      typeof rawObserver === 'function' && rawObserver.call(this, value, oldValue)
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
        return () => {
          console.error(`【setData】is invalid when using mpx to create pages or components !! instead，you can use this way【this.xx = 1】to modify data directly`)
        }
      },
      configurable: false
    },
    __getInitialData: {
      get () {
        return () => context.data
      },
      configurable: false
    },
    __render: {
      get () {
        return rawSetData
      },
      configurable: false
    },
    __processRenderData: {
      get () {
        return processRenderData
      }
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
  }
}

export default function createReactive (type) {
  return (options) => {
    // 使用Component创建page，视为混合模式
    options.blend = type === 'page'
    let currentInject
    if (global.currentInject && global.currentInject.moduleId === global.currentModuleId) {
      currentInject = global.currentInject
    }
    // 注入外部扩展写入的mixins
    options = mergeInjectedMixins(options, type)
    // 注入内建的mixins
    const builtInMixins = getBuiltInMixins(type, options)
    options.mixins = options.mixins ? builtInMixins.concat(options.mixins) : builtInMixins
    // 编译计算属性注入
    if (currentInject && currentInject.injectComputed) {
      options.mixins.push({
        computed: {
          ...currentInject.injectComputed
        }
      })
    }
    // reactiveMixin 需转换业务所有数据，故需先进行merge
    let newOptions = mergeOptions(options, type)
    // 实现响应式的mixin必须最先执行
    const defaultMixins = [getReactiveMixin(newOptions, currentInject)]
    newOptions.mixins = defaultMixins
    // 二次merge，处理融合defaultMixins
    newOptions = mergeOptions(newOptions, type)
    newOptions.properties && (newOptions.properties = transformProperties(newOptions.properties))
    /**
     * delete CustomKeys
     * 目前微信小程序对实例数据的深拷贝存在bug, 会导致数据实例的引用属性被篡改
     * 防止原生小程序未来支持这些属性导致冲突
     */
    newOptions = deleteProperties(newOptions, CustomKeys)
    Component(newOptions)
  }
}
