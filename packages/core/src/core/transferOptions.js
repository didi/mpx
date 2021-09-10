import { mergeInjectedMixins } from './injectMixins'
import mergeOptions from './mergeOptions'
import { getConvertMode } from '../convertor/getConvertMode'
import { findItem } from '../helper/utils'
import { warn } from '../helper/log'

export default function transferOptions (options, type, builtInMixins = []) {
  let currentInject
  if (global.currentInject && global.currentInject.moduleId === global.currentModuleId) {
    currentInject = global.currentInject
  }
  // 文件编译路径
  options.mpxFileResource = global.currentResource
  // 注入全局写入的mixins，原生模式下不进行注入
  if (!options.__nativeRender__) {
    options = mergeInjectedMixins(options, type)
  }
  if (currentInject && currentInject.injectComputed) {
    // 编译计算属性注入
    options.computed = Object.assign({}, options.computed, currentInject.injectComputed)
  }
  // 转换mode
  options.mpxConvertMode = options.mpxConvertMode || getConvertMode(global.currentSrcMode)
  const rawOptions = mergeOptions(options, type)
  // 注入内建的mixins, 内建mixin是按原始平台编写的，所以合并规则和rootMixins保持一致
  rawOptions.mixins = builtInMixins
  if (currentInject && currentInject.propKeys) {
    const computedKeys = Object.keys(options.computed || {})
    // 头条和百度小程序受限父子组件生命周期顺序的问题，向子组件传递computed属性，子组件初始挂载时拿不到传递下来的computed数据，在此做出提示
    currentInject.propKeys.forEach(key => {
      if (findItem(computedKeys, key)) {
        warn(`The child component can't achieve the value of computed prop [${key}] when attached, which is governed by the order of tt miniprogram's lifecycles.`, global.currentResource)
      }
    })
  }
  return {
    rawOptions,
    currentInject
  }
}
