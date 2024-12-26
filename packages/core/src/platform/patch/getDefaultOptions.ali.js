import MpxProxy from '../../core/proxy'
import builtInKeysMap from './builtInKeysMap'
import mergeOptions from '../../core/mergeOptions'
import { error, diffAndCloneA, hasOwn, noop, wrapMethodsWithErrorHandling } from '@mpxjs/utils'

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
    __getProps: {
      get () {
        return (options) => {
          const props = {}
          const validProps = Object.assign({}, options.properties, options.props)
          if (context.props) {
            Object.keys(context.props).forEach((key) => {
              if (hasOwn(validProps, key)) {
                props[key] = context.props[key]
              }
            })
          }
          if (options.__nativeRender__) {
            // 微信原生转支付宝时，首次将非函数props数据合入data中
            Object.assign(context.data, props)
          }
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

function filterOptions (options, type) {
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
      if (!hasOwn(newOptions, 'props')) {
        newOptions.props = Object.assign({}, options.props, options.properties)
      }
    } else if (key === 'methods') {
      const newMethods = wrapMethodsWithErrorHandling(options[key])
      if (type === 'page') {
        // 构造器为Page时抽取所有methods方法到顶层
        Object.assign(newOptions, newMethods)
      } else {
        newOptions[key] = newMethods
      }
    } else if (key === 'behaviors') {
      newOptions.mixins = options[key]
    } else {
      newOptions[key] = options[key]
    }
  })
  if (newOptions.relations) {
    // ali relations 需要设置 options.relations = true
    newOptions.options = newOptions.options || {}
    newOptions.options.relations = true
  }
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
  const hookNames = type === 'component' ? ['onInit', 'didMount', 'didUnmount'] : ['onLoad', 'onReady', 'onUnload']
  const rootMixins = [{
    [hookNames[0]] () {
      if (rawOptions.__nativeRender__ && this.props) {
        const validProps = Object.assign({}, rawOptions.props, rawOptions.properties)
        Object.keys(this.props).forEach((key) => {
          if (hasOwn(validProps, key)) {
            this.data[key] = this.props[key]
          }
        })
      }
      initProxy(this, rawOptions, currentInject)
    },
    deriveDataFromProps (nextProps) {
      if (this.__mpxProxy && this.__mpxProxy.isMounted() && nextProps && nextProps !== this.props) {
        const validProps = Object.assign({}, rawOptions.props, rawOptions.properties)
        if (rawOptions.__nativeRender__) {
          const newData = {}
          // 微信原生转换支付宝时，每次props更新将其设置进data模拟微信表现
          Object.keys(nextProps).forEach((key) => {
            if (hasOwn(validProps, key)) {
              const { diff, clone } = diffAndCloneA(nextProps[key], this.props[key])
              if (diff) newData[key] = clone
            }
          })
          this.setData(newData)
        } else {
          // 由于支付宝中props透传父级setData的值，此处发生变化的属性实例一定不同，只需浅比较即可确定发生变化的属性
          // 支付宝appx2.0版本后props传递发生变化，此处获取到的nextProps和this.props以及父组件setData的数据引用都不一致，进行了两次深克隆，此处this.props和nextProps的比对需要用deep diff
          Object.keys(nextProps).forEach(key => {
            if (hasOwn(validProps, key)) {
              const { diff, clone } = diffAndCloneA(nextProps[key], this.props[key])
              // 由于支付宝中透传父级setData的值，此处进行深clone后赋值避免父级存储的miniRenderData部分数据在此处被响应化，在子组件对props赋值时触发父组件的render
              if (diff) this[key] = clone
            }
          })
          this.__mpxProxy.propsUpdated()
        }
      }
    },
    [hookNames[1]] () {
      if (this.__mpxProxy) {
        this.__mpxProxy.mounted()
      } else {
        error('请在支付宝开发工具的详情设置里面，启用component2编译。依赖基础库版本 >=1.14.0')
      }
    },
    [hookNames[2]] () {
      if (this.__mpxProxy) this.__mpxProxy.unmounted()
    }
  }]
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions, type)
}
