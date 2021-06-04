import { mergeInjectedMixins } from './injectMixins'
import mergeOptions from './mergeOptions'
import { getConvertMode } from '../convertor/getConvertMode'
import { findItem } from '../helper/utils'
import { warn } from '../helper/log'

function composePropsToComputed(type, options = {}) {
  if (type === 'component') {
    options.runtimeComponent = true
    if (!options.computed) {
      options.computed = {}
    }
    options.$attrs = {}
    const props = Object.assign({}, options.properties || {}, options.props || {})
    Object.keys(props).map((key) => {
      options.$attrs[key] = true
      // 将 properties 数据转为 computed
      Object.assign(options.computed, {
        [key]() {
          return this.bigAttrs && this.bigAttrs[key]
        }
      })
    })
    delete options.properties
    delete options.props
    options.properties = {
      bigAttrs: {
        type: Object,
        value: {}
      },
      at: {
        type: Object,
        value: {}
      },
      slots: {
        type: Object,
        value: {}
      }
    }
  }
}


// 运行时和编译结果融合的过程
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

  if (currentInject && currentInject.runtimeCompile) {
    // 所有的 mixins 都处理完成后，合并 properties/props 为单 bigAttrs 属性
    composePropsToComputed(type, rawOptions)
  }

  // 注入内建的mixins, 内建mixin是按原始平台编写的，所以合并规则和rootMixins保持一致
  rawOptions.mixins = builtInMixins
  if (currentInject && currentInject.propKeys) {
    const computedKeys = Object.keys(options.computed || {})
    // 头条小程序受限父子组件生命周期顺序的问题，向子组件传递computed属性，子组件初始挂载时是拿不到对应数据的，在此做出提示
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
