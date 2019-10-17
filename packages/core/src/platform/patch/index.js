import transferOptions from '../../core/transferOptions'
import getBuiltInMixins from '../builtInMixins/index'
import { getDefaultOptions as getWXDefaultOptions } from './wx/getDefaultOptions'
import { getDefaultOptions as getALIDefaultOptions } from './ali/getDefaultOptions'
import { is } from '../../helper/env'

export default function createFactory (type) {
  return (options, { isNative, customCtor, customCtorType } = {}) => {
    options.__nativeRender__ = !!isNative
    options.__type__ = type
    if (customCtor) {
      customCtorType = customCtorType || type
      if (type === 'page' && customCtorType === 'page') {
        options.__pageCtor__ = true
      }
    }
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
    customCtor ? customCtor(defaultOptions) : global.currentCtor(defaultOptions)
  }
}

export function getRenderCallBack (context) {
  return () => {
    if (!is('ali') || context.options.__type__ === 'page') {
      context.updated()
    }
  }
}
