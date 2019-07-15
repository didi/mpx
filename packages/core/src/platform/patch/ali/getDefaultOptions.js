import {
  comparer
} from 'mobx'

import MPXProxy from '../../../core/proxy'
import customeKey from '../../../core/customOptionKeys'
import mergeOptions from '../../../core/mergeOptions'

function transformApiForProxy (context, currentInject) {
  const rawSetData = context.setData.bind(context)
  if (Object.getOwnPropertyDescriptor(context, 'setData').configurable) {
    Object.defineProperty(context, 'setData', {
      get () {
        return context.$mpxProxy.setData.bind(context.$mpxProxy)
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
  const ignoreProps = customeKey
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
      this.$mpxProxy = mpxProxy
      this.$mpxProxy.created(...params)
    },
    deriveDataFromProps (nextProps) {
      if (this.$mpxProxy && this.$mpxProxy.isMounted() && nextProps && nextProps !== this.props) {
        if (this.$rawOptions.__nativeRender__) {
          const newData = {}
          Object.keys(nextProps).forEach((key) => {
            if (!key.startsWith('$') && typeof nextProps[key] !== 'function' && !comparer.structural(this.props[key], nextProps[key])) {
              newData[key] = nextProps[key]
            }
          })
          this.$mpxProxy.setData(newData)
        } else {
          Object.keys(nextProps).forEach(key => {
            if (!key.startsWith('$') && typeof nextProps[key] !== 'function' && !comparer.structural(this.props[key], nextProps[key])) {
              this[key] = nextProps[key]
            }
          })
        }
      }
    },
    didUpdate () {
      this.$mpxProxy && this.$mpxProxy.updated()
    },
    [hookNames[1]] () {
      this.$mpxProxy && this.$mpxProxy.mounted()
    },
    [hookNames[2]] () {
      this.$mpxProxy && this.$mpxProxy.destroyed()
    }
  }]
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions, type)
}
