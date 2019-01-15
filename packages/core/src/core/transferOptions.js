import { mergeInjectedMixins } from './injectMixins'
import mergeOptions from './mergeOptions'

export default function transferOptions (options, type, builtInMixins = []) {
  let currentInject
  if (global.currentInject && global.currentInject.moduleId === global.currentModuleId) {
    currentInject = global.currentInject
  }
  // 注入全局写入的mixins
  options = mergeInjectedMixins(options, type)
  // 注入内建的mixins
  options.mixins = options.mixins ? builtInMixins.concat(options.mixins) : builtInMixins
  // 编译计算属性注入
  if (currentInject && currentInject.injectComputed) {
    options.mixins.push({
      computed: {
        ...currentInject.injectComputed
      }
    })
  }
  const rawOptions = mergeOptions(options, type)
  return {
    rawOptions,
    currentInject
  }
}
