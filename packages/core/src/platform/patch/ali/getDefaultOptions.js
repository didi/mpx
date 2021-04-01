import MPXProxy from '../../../core/proxy'
import builtInKeysMap from '../builtInKeysMap'
import mergeOptions from '../../../core/mergeOptions'
import { error } from '../../../helper/log'
import { diffAndCloneA } from '../../../helper/utils'

function transformApiForProxy (context, currentInject) {
  const rawSetData = context.setData.bind(context)
  if (Object.getOwnPropertyDescriptor(context, 'setData').configurable) {
    Object.defineProperty(context, 'setData', {
      get () {
        return function (data, callback) {
          return context.__mpxProxy.forceUpdate(data, { sync: true }, callback)
        }
      },
      configurable: true
    })
  }
  Object.defineProperties(context, {
    __getInitialData: {
      get () {
        return (options) => {
          if (context.props) {
            const newData = context.$rawOptions.__nativeRender__ ? context.data : Object.assign({}, context.data)
            const validProps = Object.assign({}, options.props, options.properties)
            Object.keys(context.props).forEach((key) => {
              if (validProps.hasOwnProperty(key) && typeof context.props[key] !== 'function') {
                newData[key] = context.props[key]
              }
            })
            return newData
          }
          return context.data
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

function filterOptions (options, type) {
  const newOptions = {}
  Object.keys(options).forEach(key => {
    if (builtInKeysMap[key]) {
      return
    }
    if (key === 'properties' || key === 'props') {
      newOptions.props = Object.assign({}, options.properties, options.props)
    } else if (key === 'methods' && type === 'page') {
      Object.assign(newOptions, options[key])
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
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
  const hookNames = type === 'component' ? ['onInit', 'didMount', 'didUnmount'] : ['onLoad', 'onReady', 'onUnload']
  const rootMixins = [{
    [hookNames[0]] () {
      if (!this.__mpxProxy) {
        initProxy(this, rawOptions, currentInject)
      }
    },
    deriveDataFromProps (nextProps) {
      if (this.__mpxProxy && this.__mpxProxy.isMounted() && nextProps && nextProps !== this.props) {
        const validProps = Object.assign({}, this.$rawOptions.props, this.$rawOptions.properties)
        if (this.$rawOptions.__nativeRender__) {
          const newData = {}
          // 微信原生转换支付宝时，每次props更新将其设置进data模拟微信表现
          Object.keys(nextProps).forEach((key) => {
            if (validProps.hasOwnProperty(key) && typeof nextProps[key] !== 'function') {
              const { diff, clone } = diffAndCloneA(nextProps[key], this.props[key])
              if (diff) newData[key] = clone
            }
          })
          this.setData(newData)
        } else {
          // 由于支付宝中props透传父级setData的值，此处发生变化的属性实例一定不同，只需浅比较即可确定发生变化的属性
          // 支付宝appx2.0版本后props传递发生变化，此处获取到的nextProps和this.props以及父组件setData的数据引用都不一致，进行了两次深克隆，此处this.props和nextProps的比对需要用deep diff
          Object.keys(nextProps).forEach(key => {
            if (validProps.hasOwnProperty(key) && typeof nextProps[key] !== 'function') {
              const { diff, clone } = diffAndCloneA(nextProps[key], this.props[key])
              // 由于支付宝中透传父级setData的值，此处进行深copy后赋值避免父级存储的miniRenderData部分数据在此处被响应化，在子组件对props赋值时触发父组件的render
              if (diff) this[key] = clone
            }
          })
        }
      }
    },
    didUpdate () {
      this.__mpxProxy && this.__mpxProxy.updated()
    },
    [hookNames[1]] () {
      if (this.__mpxProxy) {
        this.__mpxProxy.mounted()
      } else {
        error('请在支付宝开发工具的详情设置里面，启用component2编译。依赖基础库版本 >=1.14.0')
      }
    },
    [hookNames[2]] () {
      this.__mpxProxy && this.__mpxProxy.destroyed()
    }
  }]
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions, type)
}
