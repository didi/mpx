import transferOptions from '../../core/transferOptions'
import getBuiltInMixins from '../builtInMixins/index'
import { getDefaultOptions as getWxDefaultOptions } from './wx/getDefaultOptions'
import { getDefaultOptions as getAliDefaultOptions } from './ali/getDefaultOptions'
import { getDefaultOptions as getWebDefaultOptions } from './web/getDefaultOptions'
import { getDefaultOptions as getQaDefaultOptions } from './qa/getDefaultOptions'
import { error } from '../../helper/log'

export default function createFactory (type) {
  return (options, { isNative, customCtor, customCtorType } = {}) => {
    options.__nativeRender__ = !!isNative
    options.__type__ = type
    let ctor
    if (__mpx_mode__ !== 'web' && __mpx_mode__ !== 'qa') {
      if (customCtor) {
        ctor = customCtor
        customCtorType = customCtorType || type
        if (type === 'page' && customCtorType === 'page') {
          options.__pageCtor__ = true
        }
      } else {
        if (global.currentCtor) {
          ctor = global.currentCtor
          if (global.currentCtorType === 'page') {
            options.__pageCtor__ = true
          }
        } else {
          if (type === 'page') {
            ctor = Page
            options.__pageCtor__ = true
          } else {
            ctor = Component
          }
        }
      }
    }

    let getDefaultOptions
    if (__mpx_mode__ === 'web') {
      getDefaultOptions = getWebDefaultOptions
    } else if (__mpx_mode__ === 'ali') {
      getDefaultOptions = getAliDefaultOptions
    } else if (__mpx_mode__ === 'qa') {
      getDefaultOptions = getQaDefaultOptions
    } else {
      getDefaultOptions = getWxDefaultOptions
    }

    // 获取内建的mixins
    const builtInMixins = getBuiltInMixins(options, type)
    const { rawOptions, currentInject } = transferOptions(options, type, builtInMixins)
    const defaultOptions = getDefaultOptions(type, { rawOptions, currentInject })
    if (defaultOptions.pageShow || defaultOptions.pageHide) {
      error('出于性能考虑，pageShow/pageHide增强钩子将在下个版本被移除，请使用原生的pageLifetimes替代，此外请不要强依赖pageLifetimes.show进行初始化操作，因为pageLifetimes.show并不能保证在初始化时一定被调用！', global.currentResource)
    }
    if (__mpx_mode__ === 'web' || __mpx_mode__ === 'qa') {
      global.currentOption = defaultOptions
    } else if (ctor) {
      return ctor(defaultOptions)
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
