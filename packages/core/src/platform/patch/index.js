import transferOptions from '../../core/transferOptions'
import getBuiltInMixins from '../builtInMixins/index'
import { getDefaultOptions } from './getDefaultOptions'
import { error, isReact, isWeb } from '@mpxjs/utils'

export default function createFactory (type) {
  return (options = {}, { isNative, customCtor, customCtorType } = {}) => {
    options.__nativeRender__ = !!isNative
    options.__type__ = type
    let ctor
    if (!isWeb && !isReact) {
      if (customCtor) {
        ctor = customCtor
        customCtorType = customCtorType || type
        if (type === 'page' && customCtorType === 'page') {
          options.__pageCtor__ = true
        }
      } else {
        if (mpxGlobal.currentCtor) {
          ctor = mpxGlobal.currentCtor
          if (mpxGlobal.currentCtorType === 'page') {
            options.__pageCtor__ = true
          }
          if (mpxGlobal.currentResourceType && mpxGlobal.currentResourceType !== type) {
            error(`The ${mpxGlobal.currentResourceType} [${mpxGlobal.currentResource}] is not supported to be created by ${type} constructor.`)
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

    const { setup } = options
    const { rawOptions, currentInject } = transferOptions(options, type)
    rawOptions.setup = setup
    // 不接受mixin中的setup配置
    // 注入内建的mixins, 内建mixin是按原始平台编写的，所以合并规则和rootMixins保持一致
    // 将合并后的用户定义的rawOptions传入获取当前应该注入的内建mixins
    rawOptions.mixins = getBuiltInMixins({ type, rawOptions, currentInject })
    const defaultOptions = getDefaultOptions({ type, rawOptions, currentInject })
    if (isWeb || isReact) {
      global.__mpxOptionsMap = global.__mpxOptionsMap || {}
      global.__mpxOptionsMap[currentInject.moduleId] = defaultOptions
    } else if (ctor) {
      return ctor(defaultOptions)
    }
  }
}
