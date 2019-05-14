import transferOptions from '../../core/transferOptions'
import getBuiltInMixins from '../builtInMixins/index'
import { getDefaultOptions as getWXDefaultOptions } from './wx/getDefaultOptions'
import { getDefaultOptions as getALIDefaultOptions } from './ali/getDefaultOptions'
import { is } from '../../helper/env'

export default function createFactory (type) {
  return (options, { isNative } = {}) => {
    options.__nativeRender__ = !!isNative
    options.__type__ = type
    let getDefaultOptions
    if (is('ali')) {
      getDefaultOptions = getALIDefaultOptions
    } else {
      getDefaultOptions = getWXDefaultOptions
    }
    // 获取内建的mixins
    const builtInMixins = getBuiltInMixins(options, type)
    const { rawOptions, currentInject } = transferOptions(options, type, builtInMixins)
    const defaultOptions = getDefaultOptions(type, { rawOptions, currentInject })
    global.currentCtor(defaultOptions)
  }
}

export function getRenderCallBack (context) {
  return () => {
    if (!is('ali') || context.options.__type__ === 'page') {
      context.updated()
    }
  }
}
