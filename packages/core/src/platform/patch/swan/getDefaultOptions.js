import mergeOptions from '../../../core/mergeOptions'
import { getRootMixins, initProxy } from '../wx/getDefaultOptions'


export function getDefaultOptions (type, { rawOptions = {}, currentInject }) {
  const hookNames = ['attached', 'ready', 'detached']
  // 构造页面时统一使用onInit进行初始化
  if (type === 'page') {
    hookNames[0] = 'onInit'
  }
  // 当用户传入page作为构造器构造页面时，修改所有关键hooks
  if (rawOptions.__pageCtor__) {
    hookNames[1] = 'onReady'
    hookNames[2] = 'onUnload'
  }

  const rootMixins = getRootMixins({
    [hookNames[0]] (...params) {
      if (!this.__mpxProxy) {
        initProxy(this, rawOptions, currentInject, params)
      }
    },
    [hookNames[1]] () {
      this.__mpxProxy && this.__mpxProxy.mounted()
    },
    [hookNames[2]] () {
      this.__mpxProxy && this.__mpxProxy.destroyed()
    }
  }, rawOptions.__pageCtor__)
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions)
}
