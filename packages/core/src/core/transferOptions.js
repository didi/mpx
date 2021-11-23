import { mergeInjectedMixins } from './injectMixins'
import mergeOptions from './mergeOptions'
import { getConvertMode } from '../convertor/getConvertMode'
import { findItem, hasOwn, camelize, isPlainObject, findPropConstructor } from '../helper/utils'
import { warn } from '../helper/log'

function getPropDefaultValue (context, prop) {
  if (hasOwn(prop, 'type')) {
    const Constructor = findPropConstructor(prop.type)
    return hasOwn(prop, 'value')
      ? typeof prop.value === 'function'
        ? prop.value.call(context)
        : prop.value
      : Constructor()
  }
  if (!isPlainObject(prop)) {
    const Constructor = findPropConstructor(prop)
    if (Constructor) {
      return Constructor()
    }
  }
}

function composePropsToComputed (type, options = {}) {
  if (type === 'component' || type === 'page') {
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
        [key] () {
          const camelCaseKey = camelize(key)
          let value
          if (this.bigAttrs) {
            value = this.bigAttrs[key] || this.bigAttrs[camelCaseKey]
          }
          if (value === undefined || value === null) {
            value = getPropDefaultValue(this, props[key])
          }
          return value
        }
      })
    })
    delete options.properties
    delete options.props
    options.properties = {
      bigAttrs: {
        type: null
      },
      slots: {
        type: null
      }
    }
  }
}

// 运行时和编译结果融合的过程
export default function transferOptions (options, type) {
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
    // 编译option注入,优先微信中的单独配置
    options.options = Object.assign({}, currentInject.injectOptions, options.options)
  }
  // 转换mode
  options.mpxConvertMode = options.mpxConvertMode || getConvertMode(global.currentSrcMode)
  const rawOptions = mergeOptions(options, type)

  if (currentInject && currentInject.runtimeCompile) {
    // 所有的 mixins 都处理完成后，合并 properties/props 为单 bigAttrs 属性
    composePropsToComputed(type, rawOptions)
  }

  if (currentInject && currentInject.propKeys) {
    const computedKeys = Object.keys(rawOptions.computed || {})
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
