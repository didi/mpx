import MPXProxy from '../../../core/proxy'
import builtInKeysMap from '../builtInKeysMap'
import mergeOptions from '../../../core/mergeOptions'
// import { error } from '../../../helper/log'

function transformApiForProxy (context, currentInject) {
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
    if (builtInKeysMap[key] || (key === 'data' && typeof options[key] === 'function')) {
      return
    }
    if (key === 'properties' || key === 'props') {
      newOptions['props'] = Object.assign({}, options['properties'], options['props'])
    } else if (key === 'methods') {
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
    onInit (...params) {
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
