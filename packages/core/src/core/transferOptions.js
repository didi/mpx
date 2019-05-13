import { mergeInjectedMixins } from './injectMixins'
import mergeOptions from './mergeOptions'
import { getConvertMode } from '../convertor/getConvertMode'

export default function transferOptions (options, type, builtInMixins = []) {
  let currentInject
  if (global.currentInject && global.currentInject.moduleId === global.currentModuleId) {
    currentInject = global.currentInject
  }
  // 注入全局写入的mixins
  options = mergeInjectedMixins(options, type)
  // 注入内建的mixins
  options.mixins = options.mixins ? builtInMixins.concat(options.mixins) : builtInMixins

  if (currentInject && currentInject.injectComputed) {
    // 编译计算属性注入
    options.computed = Object.assign({}, options.computed, currentInject.injectComputed)
  }
  // 转换mode
  options.mpxConvertMode = options.mpxConvertMode || getConvertMode(global.currentSrcMode, __mpx_mode__)
  const rawOptions = mergeOptions(options, type)
  return {
    rawOptions,
    currentInject
  }
}
