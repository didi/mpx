import mergeOptions from '../../../core/mergeOptions'
import { initProxy, filterOptions } from '../wx/getDefaultOptions'

export function getDefaultOptions ({ type, rawOptions = {}, currentInject }) {
  let hookNames = ['attached', 'ready', 'detached']
  // 当用户传入page作为构造器构造页面时，修改所有关键hooks
  if (rawOptions.__pageCtor__) {
    hookNames = ['onLoad', 'onReady', 'onUnload']
  }

  const rootMixin = {
    [hookNames[0]] () {
      initProxy(this, rawOptions, currentInject)
    },
    [hookNames[1]] () {
      if (this.__mpxProxy) this.__mpxProxy.mounted()
    },
    [hookNames[2]] () {
      if (this.__mpxProxy) this.__mpxProxy.unmounted()
    }
  }

  // 如构造页面，优先使用onInit进行初始化
  if (type === 'page') {
    rootMixin.onInit = function (...params) {
      initProxy(this, rawOptions, currentInject, params)
    }
  }

  const rootMixins = [rootMixin]
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions)
}
