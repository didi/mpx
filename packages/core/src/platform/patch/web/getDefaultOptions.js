import builtInKeysMap from '../builtInKeysMap'
import mergeOptions from '../../../core/mergeOptions'
import MPXProxy from '../../../core/proxy'
import { diffAndCloneA } from '../../../helper/utils'

function filterOptions (options) {
  const newOptions = {}
  Object.keys(options).forEach(key => {
    if (builtInKeysMap[key]) {
      return
    }
    if (key === 'data' || key === 'dataFn') {
      newOptions.data = function mergeFn () {
        return Object.assign(
          diffAndCloneA(options.data || {}).clone,
          options.dataFn && options.dataFn.call(this)
        )
      }
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
}

function initProxy (context, rawOptions) {
  // 缓存options
  context.$rawOptions = rawOptions
  // 创建proxy对象
  const mpxProxy = new MPXProxy(rawOptions, context)
  context.__mpxProxy = mpxProxy
  context.__mpxProxy.created()
}

export function getDefaultOptions (type, { rawOptions = {} }) {
  const rootMixins = [{
    created () {
      if (!this.__mpxProxy) {
        initProxy(this, rawOptions)
      }
    },
    mounted () {
      this.__mpxProxy && this.__mpxProxy.mounted()
    },
    updated () {
      this.__mpxProxy && this.__mpxProxy.updated()
    },
    destroyed () {
      this.__mpxProxy && this.__mpxProxy.destroyed()
    }
  }]
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions)
}
