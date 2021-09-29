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
  if (currentInject && currentInject.injectOptions) {
    // cwy-编译option注入,优先微信中的单独配置
    options.options = Object.assign({}, currentInject.injectOptions, options.options)
  }
  // 转换mode
  options.mpxConvertMode = options.mpxConvertMode || getConvertMode(global.currentSrcMode)
  const rawOptions = mergeOptions(options, type)
  // 注入内建的mixins, 内建mixin是按原始平台编写的，所以合并规则和rootMixins保持一致
  rawOptions.mixins = builtInMixins
  if (currentInject && currentInject.propKeys) {
    const computedKeys = Object.keys(options.computed || {})
    // 头条和百度小程序由于props传递为异步操作，通过props向子组件传递computed数据时，子组件无法在初始时(created/attached)获取到computed数据，如需进一步处理数据建议通过watch获取
    currentInject.propKeys.forEach(key => {
      if (findItem(computedKeys, key)) {
        warn(`由于平台机制原因，子组件无法在初始时(created/attached)获取到通过props传递的计算属性[${key}]，该问题一般不影响渲染，如需进一步处理数据建议通过watch获取。`, global.currentResource)
      }
    })
  }
  return {
    rawOptions,
    currentInject
  }
}
