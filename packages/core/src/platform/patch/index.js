import transferOptions from '../../core/transferOptions'
import getBuiltInMixins from '../builtInMixins/index'
import { getDefaultOptions as getWxDefaultOptions } from './wx/getDefaultOptions'
import { getDefaultOptions as getAliDefaultOptions } from './ali/getDefaultOptions'
import { getDefaultOptions as getWebDefaultOptions } from './web/getDefaultOptions'

export default function createFactory (type) {
  return (options, { isNative } = {}) => {
    options.__nativeRender__ = !!isNative
    options.__type__ = type
    let getDefaultOptions
    switch (__mpx_mode__) {
      case 'web':
        getDefaultOptions = getWebDefaultOptions
        break
      case 'ali':
        getDefaultOptions = getAliDefaultOptions
        break
      default:
        getDefaultOptions = getWxDefaultOptions
    }
    // 获取内建的mixins
    const builtInMixins = getBuiltInMixins(options, type)
    const { rawOptions, currentInject } = transferOptions(options, type, builtInMixins)
    const defaultOptions = getDefaultOptions(type, { rawOptions, currentInject })
    if (__mpx_mode__ === 'web') {
      global.currentOption = defaultOptions
    } else {
      global.currentCtor(defaultOptions)
    }
  }
}

export function getRenderCallBack (context) {
  return () => {
    if (__mpx_mode__ !== 'ali' || context.options.__type__ === 'page') {
      context.updated()
    }
  }
}
