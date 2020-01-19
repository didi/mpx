import customKey from '../customOptionKeys'
import mergeOptions from '../../../core/mergeOptions'
import MPXProxy from '../../../core/proxy'
import { SHOW, HIDE } from '../../../core/innerLifecycle'

function filterOptions (options) {
  const newOptions = {}
  const ignoreProps = customKey
  Object.keys(options).forEach(key => {
    if (ignoreProps.indexOf(key) !== -1) {
      return
    }
    newOptions[key] = options[key]
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
  if (type === 'page') {
    rootMixins.push({
      activated () {
        this.__mpxProxy && this.__mpxProxy.callUserHook(SHOW)
      },
      deactivated () {
        this.__mpxProxy && this.__mpxProxy.callUserHook(HIDE)
      }
    })
  }
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions)
}
