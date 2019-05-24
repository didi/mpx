import {
  enumerableKeys,
  extend
} from '../../../helper/utils'

import MPXProxy from '../../../core/proxy'
import customeKey from '../../../core/customOptionKeys'
import mergeOptions from '../../../core/mergeOptions'

function transformProperties (properties) {
  if (!properties) {
    return {}
  }
  const newProps = {}
  enumerableKeys(properties).forEach(key => {
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
      newFiled = extend({}, rawFiled)
    }
    newFiled.observer = function (value, oldValue) {
      if (this.$mpxProxy) {
        this[key] = value
        this.$mpxProxy.updated()
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
        return this.$mpxProxy.setData.bind(this.$mpxProxy)
      },
      configurable: true
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
  const ignoreProps = customeKey
  Object.keys(options).forEach(key => {
    if (ignoreProps.indexOf(key) !== -1 || (key === 'data' && typeof options[key] === 'function')) {
      return
    }
    if (key === 'properties' || key === 'props') {
      newOptions['properties'] = transformProperties(Object.assign({}, options['properties'], options['props']))
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
}

export function getDefaultOptions (type, { rawOptions = {}, currentInject }) {
  const options = filterOptions(rawOptions)
  options.mixins = [{
    attached () {
      // 提供代理对象需要的api
      transformApiForProxy(this, currentInject)
      // 缓存options
      this.$rawOptions = rawOptions
      // 创建proxy对象
      const mpxProxy = new MPXProxy(rawOptions, this)
      this.$mpxProxy = mpxProxy
      // 组件监听视图数据更新, attached之后才能拿到properties
      this.$mpxProxy.created()
    },
    ready () {
      this.$mpxProxy && this.$mpxProxy.mounted()
    },
    detached () {
      this.$mpxProxy && this.$mpxProxy.destroyed()
    }
  }]
  return mergeOptions(options, type, false)
}
