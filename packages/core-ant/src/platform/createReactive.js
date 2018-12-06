import {
  extras
} from 'mobx'

import {
  proxy,
  deleteProperties,
  enumerableKeys,
  dissolveAttrs
} from '../helper/utils'

import { mergeInjectedMixins } from '../core/injectMixins'
import mergeOptions from '../core/mergeOptions'
import getBuiltInMixins from './builtInMixins/index'
import MPXProxy from '../core/proxy'
import CustomKeys from '../core/customOptionKeys'

function getReactiveMixin (mixinType, options = {}) {
  const hookNames = mixinType === 'component' ? ['didMount', 'didUnmount'] : ['onLoad', 'onUnload']
  return {
    [hookNames[0]] () {
      // 提供代理对象需要的api
      transformApiForProxy(this)
      // 缓存options
      this.$rawOptions = options
      // 挂载原型属性到实例上
      proxy(this, options.proto, enumerableKeys(options.proto), true)
      // 创建proxy对象
      const mpxProxy = new MPXProxy(options, this, true)
      this.$mpxProxy = mpxProxy
      // 挂载$watch
      this.$watch = (...rest) => mpxProxy.watch(...rest)
      // 挂载设置组件当次更新后执行的回调
      this.$updated = (...rest) => mpxProxy.updated(...rest)
      // 强制执行render
      this.$forceUpdate = (...rest) => mpxProxy.forceUpdate(...rest)
      mpxProxy.watchRender()
    },
    didUpdate (prevProps) {
      if (prevProps && prevProps !== this.props) {
        Object.keys(prevProps).forEach(key => {
          if (!extras.deepEqual(this.props[key], prevProps[key])) {
            this[key] = this.props[key]
          }
        })
      }
    },
    [hookNames[1]] () {
      this.$mpxProxy.clearWatchers()
    }
  }
}

function transformApiForProxy (context) {
  const rawSetData = context.setData.bind(context)
  Object.defineProperties(context, {
    __getInitialData: {
      get () {
        return () => Object.assign({}, context.props, context.data)
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
}

export default function createReactive (type) {
  return (options, constructor) => {
    // 注入外部扩展写入的mixins
    options = mergeInjectedMixins(options, type)
    // 注入内建的mixins
    const builtInMixins = getBuiltInMixins(type, options)
    options.mixins = options.mixins ? builtInMixins.concat(options.mixins) : builtInMixins
    // reactiveMixin 需转换业务所有数据，故需先进行merge
    let newOptions = mergeOptions(options, type)
    // 实现响应式的mixin必须最先执行
    const defaultMixins = [getReactiveMixin(type, newOptions)]
    newOptions.mixins = defaultMixins
    // 二次merge，处理融合defaultMixins
    newOptions = mergeOptions(newOptions, type)
    if (type === 'page') {
      newOptions = dissolveAttrs(newOptions, 'methods')
    }
    newOptions = deleteProperties(newOptions, CustomKeys)
    constructor(newOptions)
  }
}
