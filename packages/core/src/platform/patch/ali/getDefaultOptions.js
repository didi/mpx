import MPXProxy from '../../../core/proxy'
import customKey from '../customOptionKeys'
import mergeOptions from '../../../core/mergeOptions'
import { error } from '../../../helper/log'

function transformApiForProxy (context, currentInject) {
  const rawSetData = context.setData.bind(context)
  if (Object.getOwnPropertyDescriptor(context, 'setData').configurable) {
    Object.defineProperty(context, 'setData', {
      get () {
        return context.__mpxProxy.forceUpdate.bind(context.__mpxProxy)
      },
      configurable: true
    })
  }
  Object.defineProperties(context, {
    __getInitialData: {
      get () {
        return () => {
          if (context.props) {
            const newData = context.$rawOptions.__nativeRender__ ? context.data : Object.assign({}, context.data)
            Object.keys(context.props).forEach((key) => {
              if (!key.startsWith('$') && typeof context.props[key] !== 'function') {
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
  const ignoreProps = customKey
  Object.keys(options).forEach(key => {
    if (ignoreProps.indexOf(key) !== -1 || (key === 'data' && typeof options[key] === 'function')) {
      return
    }
    if (key === 'properties' || key === 'props') {
      newOptions['props'] = Object.assign({}, options['properties'], options['props'])
    } else if (key === 'methods' && type === 'page') {
      Object.assign(newOptions, options[key])
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
}

export function getDefaultOptions (type, { rawOptions = {}, currentInject }) {
  const hookNames = type === 'component' ? ['onInit', 'didMount', 'didUnmount'] : ['onLoad', 'onReady', 'onUnload']
  const rootMixins = [{
    [hookNames[0]] (...params) {
      // 提供代理对象需要的api
      transformApiForProxy(this, currentInject)
      // 缓存options
      this.$rawOptions = rawOptions
      // 创建proxy对象
      const mpxProxy = new MPXProxy(rawOptions, this)
      this.__mpxProxy = mpxProxy
      this.__mpxProxy.created(...params)
    },
    deriveDataFromProps (nextProps) {
      if (this.__mpxProxy && this.__mpxProxy.isMounted() && nextProps && nextProps !== this.props) {
        if (this.$rawOptions.__nativeRender__) {
          const newData = {}
          // 微信原生转换支付宝时，每次props更新将其设置进data模拟微信表现
          Object.keys(nextProps).forEach((key) => {
            if (!key.startsWith('$') && typeof nextProps[key] !== 'function' && nextProps[key] !== this.props[key]) {
              newData[key] = nextProps[key]
            }
          })
          this.__mpxProxy.forceUpdate(newData)
        } else {
          // 此处发生变化的属性实例一定不同，只需浅比较即可确定发生变化的属性
          Object.keys(nextProps).forEach(key => {
            if (!key.startsWith('$') && typeof nextProps[key] !== 'function' && nextProps[key] !== this.props[key]) {
              this[key] = nextProps[key]
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
