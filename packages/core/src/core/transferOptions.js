import { mergeInjectedMixins } from './injectMixins'
import mergeOptions from './mergeOptions'
import { getConvertMode } from '../convertor/getConvertMode'
import { findItem } from '../helper/utils'

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
  if (options.mpxConvertMode === 'wxToAli' && type === 'component') {
    // ali组件标签无法透传style和class属性
    options.properties = Object.assign({}, options.properties, {
      mpxClass: {
        type: String,
        value: ''
      },
      mpxStyle: {
        type: String,
        value: ''
      }
    })
  }
  const rawOptions = mergeOptions(options, type)
  if (currentInject && currentInject.propKeys) {
    const computedKeys = Object.keys(options.computed || {})
    // 头条小程序受限父子组件生命周期顺序的问题，向子组件传递computed属性，子组件初始挂载时是拿不到对应数据的，在此做出提示
    currentInject.propKeys.forEach(key => {
      if (findItem(computedKeys, key)) {
        console.error(`The child component can't achieve the value of computed prop【${key}】when attached, which is governed by the order of current miniprogram's lifecycles `)
      }
    })
  }
  return {
    rawOptions,
    currentInject
  }
}
