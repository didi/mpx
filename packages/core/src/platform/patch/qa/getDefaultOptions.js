import MPXProxy from '../../../core/proxy'
import customKey from '../customOptionKeys'
import mergeOptions from '../../../core/mergeOptions'
import { error } from '../../../helper/log'

function transformApiForProxy (context, currentInject) {
  context.setData = function () {}
  const rawSetData = context.setData.bind(context)
  Object.defineProperties(context, {
    setData: {
      get () {
        return context.__mpxProxy.forceUpdate.bind(context.__mpxProxy)
      },
      configurable: true
    },
    __getInitialData: {
      get () {
        return () => {
          return context._data
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
  // const hookNames = type === 'component' ? ['onInit', 'onReady', 'onDestroy'] : ['onInit', 'onReady', 'onUnload']
  const rootMixins = [{
    onInit(...params) {
      // 提供代理对象需要的api
      transformApiForProxy(this, currentInject)
      // 缓存options
      this.$rawOptions = rawOptions
      // 创建proxy对象
      const mpxProxy = new MPXProxy(rawOptions, this)
      this.__mpxProxy = mpxProxy
      this.__mpxProxy.created(...params)
    },
    onReady () {
      this.__mpxProxy && this.__mpxProxy.mounted()
    },
    onDestroy () {
      this.__mpxProxy && this.__mpxProxy.destroyed()
    }
  }]
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions, type)
}
