import {
  enumerableKeys,
  extend
} from '../../../helper/utils'

import MPXProxy from '../../../core/proxy'

function transformProperties (properties) {
  if (!properties) {
    return {}
  }
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
      if (this.$mpxProxy) {
        this[key] = value
        this.$mpxProxy.updated()
      }
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
    if (currentInject.getRenderData) {
      Object.defineProperties(context, {
        __getRenderData: {
          get () {
            return currentInject.getRenderData
          },
          configurable: false
        }
      })
    }
  }
}

export function getDefaultOptions (type, { rawOptions = {}, currentInject }) {
  return {
    properties: transformProperties(rawOptions.props),
    methods: rawOptions.methods || {},
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
    detached () {
      this.$mpxProxy.destroyed()
    }
  }
}
