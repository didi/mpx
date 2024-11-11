import transferOptions from '../../core/transferOptions'
import getBuiltInMixins from '../builtInMixins/index'
import { getDefaultOptions as getWxDefaultOptions } from './wx/getDefaultOptions'
import { getDefaultOptions as getAliDefaultOptions } from './ali/getDefaultOptions'
import { getDefaultOptions as getSwanDefaultOptions } from './swan/getDefaultOptions'
import { getDefaultOptions as getWebDefaultOptions } from './web/getDefaultOptions'
import { getDefaultOptions as getReactDefaultOptions } from './react/getDefaultOptions'
import { error, isReact } from '@mpxjs/utils'

export default function createFactory (type) {
  return (options = {}, { isNative, customCtor, customCtorType } = {}) => {
    options.__nativeRender__ = !!isNative
    options.__type__ = type
    let ctor
    if (__mpx_mode__ !== 'web' && !isReact) {
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
          if (global.currentResourceType && global.currentResourceType !== type) {
            error(`The ${global.currentResourceType} [${global.currentResource}] is not supported to be created by ${type} constructor.`)
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
    if (isReact) {
      getDefaultOptions = getReactDefaultOptions
    } else if (__mpx_mode__ === 'web') {
      getDefaultOptions = getWebDefaultOptions
    } else if (__mpx_mode__ === 'ali') {
      getDefaultOptions = getAliDefaultOptions
    } else if (__mpx_mode__ === 'swan') {
      getDefaultOptions = getSwanDefaultOptions
    } else {
      getDefaultOptions = getWxDefaultOptions
    }

    const { setup } = options
    const { rawOptions, currentInject } = transferOptions(options, type)
    rawOptions.setup = setup
    // 不接受mixin中的setup配置
    // 注入内建的mixins, 内建mixin是按原始平台编写的，所以合并规则和rootMixins保持一致
    // 将合并后的用户定义的rawOptions传入获取当前应该注入的内建mixins
    rawOptions.mixins = getBuiltInMixins({ type, rawOptions, currentInject })
    const defaultOptions = getDefaultOptions({ type, rawOptions, currentInject })
    if (__mpx_mode__ === 'web' || isReact) {
      global.__mpxOptionsMap = global.__mpxOptionsMap || {}
      global.__mpxOptionsMap[currentInject.moduleId] = defaultOptions
    } else if (ctor) {
      return ctor(defaultOptions)
    }
  }
}
