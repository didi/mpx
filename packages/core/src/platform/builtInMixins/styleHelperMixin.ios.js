import { isObject, isArray, dash2hump, cached, isEmptyObject, hasOwn } from '@mpxjs/utils'
import * as perf from '@mpxjs/perf'
import { StyleSheet, Dimensions } from 'react-native'
import { reactive } from '../../observer/reactive'
import { getStyleDimensions, initDimensionsInfo, syncDimensions } from '../dimensionsHelper'

initDimensionsInfo({
  window: Dimensions.get('window'),
  screen: Dimensions.get('screen')
})
global.__mpxSizeCount = 0
global.__mpxPageSizeCountMap = reactive({})

global.__GCC = function (className, classMap, classMapValueCache) {
  if (!classMapValueCache.has(className)) {
    const originalDependentWindowSize = dependentWindowSize
    dependentWindowSize = false

    const styleObj = classMap[className]?.(formatValue)
    if (!styleObj) {
      dependentWindowSize = originalDependentWindowSize
      return
    }

    styleObj._dependentWindowSize = dependentWindowSize
    dependentWindowSize = dependentWindowSize || originalDependentWindowSize

    classMapValueCache.set(className, styleObj)
  }
  return classMapValueCache.get(className)
}

function onDimensionsChange (dimensions) {
  if (!dimensions) {
    dimensions = {
      window: Dimensions.get('window'),
      screen: Dimensions.get('screen')
    }
  }
  syncDimensions(dimensions)
}

global.notifyDimensionsChange = onDimensionsChange
global.getStyleDimensions = dimensionsBase => Object.assign({}, getStyleDimensions(dimensionsBase))

Dimensions.addEventListener('change', onDimensionsChange)

// TODO: 存在部分安卓折叠屏机型在折叠/展开切换时，Dimensions 监听到的 width/height 尺寸错误，并触发多次问题
function rpx (value) {
  // rn 单位 dp = 1(css)px =  1 物理像素 * pixelRatio(像素比)
  // px = rpx * (样式计算宽度 / 750)
  return value * getStyleDimensions().width / 750
}
function vw (value) {
  return value * getStyleDimensions().width / 100
}
function vh (value) {
  return value * getStyleDimensions().height / 100
}

const unit = {
  rpx,
  vw,
  vh
}

const empty = {}

// 记录 style 是否依赖窗口尺寸
let dependentWindowSize = false
const isNum = (v) => !isNaN(+v)
function formatValue (value, unitType) {
  if (unitType && typeof unit[unitType] === 'function') {
    dependentWindowSize = true
    return unit[unitType](+value)
  }
  if (value === 'hairlineWidth') {
    return StyleSheet.hairlineWidth
  }
  const matched = unitRegExp.exec(value)
  if (matched) {
    if (!matched[2] || matched[2] === 'px') {
      return +matched[1]
    } else {
      dependentWindowSize = true
      return unit[matched[2]](+matched[1])
    }
  }
  return value
}

global.__formatValue = formatValue

function concat (a = '', b = '') {
  return a ? b ? (a + ' ' + b) : a : b
}

function stringifyArray (value) {
  let res = ''
  let classString
  for (let i = 0; i < value.length; i++) {
    if ((classString = stringifyDynamicClass(value[i]))) {
      if (res) res += ' '
      res += classString
    }
  }
  return res
}

function stringifyObject (value) {
  let res = ''
  const keys = Object.keys(value)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (value[key]) {
      if (res) res += ' '
      res += key
    }
  }
  return res
}

function stringifyDynamicClass (value) {
  if (isArray(value)) {
    value = stringifyArray(value)
  } else if (isObject(value)) {
    value = stringifyObject(value)
  }
  return value
}

const listDelimiter = /;(?![^(]*[)])/g
const propertyDelimiter = /:(.+)/
const unitRegExp = /^\s*(-?(?:\d+(?:\.\d+)?|\.\d+))(rpx|vw|vh|px)?\s*$/
const varRegExp = /^--/

const parseStyleText = cached((cssText) => {
  if (typeof cssText !== 'string') return cssText
  const res = {}
  const arr = cssText.split(listDelimiter)
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (item) {
      const tmp = item.split(propertyDelimiter)
      if (tmp.length > 1) {
        let k = tmp[0].trim()
        k = varRegExp.test(k) ? k : dash2hump(k)
        res[k] = tmp[1].trim()
      }
    }
  }
  return res
})

function normalizeDynamicStyle (value) {
  if (!value) return {}
  if (isArray(value)) {
    return mergeObjectArray(value)
  }
  if (typeof value === 'string') {
    return parseStyleText(value)
  }
  return value
}

function mergeObjectArray (arr) {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    Object.assign(res, arr[i])
  }
  return res
}

function transformStyleObj (styleObj) {
  const transformed = {}
  Object.keys(styleObj).forEach((prop) => {
    let value = styleObj[prop]

    // check important
    const importantValue = typeof value === 'string' && value.endsWith('!important')
    if (importantValue) {
      transformed._inlineLayer = transformed._inlineLayer || {}
      transformed._inlineLayer.important = transformed._inlineLayer.important || {}
      value = value.split('!')[0]
    }

    // format value
    if (prop === 'lineHeight' && isNum(value)) {
      if (+value === 0) {
        value = 0
      } else {
        value = `${Math.round(value * 100)}%`
      }
    } else if (prop !== 'flex') {
      value = formatValue(value)
    }

    // set value
    if (importantValue) {
      transformed._inlineLayer.important[prop] = value
    } else {
      transformed[prop] = value
    }
  })

  return transformed
}

function isNativeStyle (style) {
  return Array.isArray(style) || (
    typeof style === 'object' &&
    // Reanimated 的 animated style 通常会包含 viewDescriptors 或 _animations
    (hasOwn(style, 'viewDescriptors') || hasOwn(style, '_animations'))
  )
}

function getMediaStyle (media) {
  if (!media || !media.length) return {}
  dependentWindowSize = true
  const { width } = getStyleDimensions()
  return media.reduce((styleObj, item) => {
    const { options = {}, value = {} } = item
    const { minWidth, maxWidth } = options
    const hasMinWidth = !isNaN(minWidth)
    const hasMaxWidth = !isNaN(maxWidth)
    const matched = hasMinWidth && hasMaxWidth
      ? width >= minWidth && width <= maxWidth
      : hasMinWidth
        ? width >= minWidth
        : hasMaxWidth && width <= maxWidth
    if (matched) {
      Object.keys(value).forEach(key => {
        if (key !== '_inlineLayer') styleObj[key] = value[key]
      })
      if (value._inlineLayer) {
        styleObj._inlineLayer = styleObj._inlineLayer || {}
        Object.keys(value._inlineLayer).forEach(layer => {
          styleObj._inlineLayer[layer] = Object.assign(
            styleObj._inlineLayer[layer] || {},
            value._inlineLayer[layer]
          )
        })
      }
    }
    return styleObj
  }, {})
}

const createLayer = (isNativeStyle) => {
  const layerMap = {
    preflight: [],
    app: [],
    uno: [],
    normal: [],
    important: []
  }

  const checkInlineLayer = style => {
    Object.keys(style._inlineLayer).forEach(l => {
      mergeToLayer(l, style._inlineLayer[l])
    })
  }

  const mergeToLayer = (name, style, mediaStyle) => {
    const layer = layerMap[name] || layerMap.normal
    layer.push(style)
    if (style._inlineLayer) checkInlineLayer(style, mergeToLayer)
    if (mediaStyle) {
      layer.push(mediaStyle)
      if (mediaStyle._inlineLayer) checkInlineLayer(mediaStyle, mergeToLayer)
    }
  }

  const mergeToLayerWithStyles = (name, styles) => {
    styles.forEach(v => mergeToLayer(name, v))
  }

  const removeInternalProps = style => {
    if (!isObject(style) || (!hasOwn(style, '_inlineLayer') && !hasOwn(style, '_dependentWindowSize'))) return style
    const result = Object.assign({}, style)
    delete result._inlineLayer
    delete result._dependentWindowSize
    return result
  }

  const genResult = isNativeStyle
    ? () => {
        return [
          ...layerMap.preflight,
          ...layerMap.app,
          ...layerMap.uno,
          ...layerMap.normal,
          ...layerMap.important
        ].map(removeInternalProps)
      }
    : () => {
        const res = Object.assign(
          {},
          ...layerMap.preflight,
          ...layerMap.app,
          ...layerMap.uno,
          ...layerMap.normal,
          ...layerMap.important
        )
        delete res._inlineLayer
        delete res._dependentWindowSize
        return res
      }

  return {
    mergeToLayer,
    mergeToLayerWithStyles,
    genResult
  }
}

const HIDE_STYLE = {
  // display: 'none'
  // RN下display:'none'容易引发未知异常问题，使用布局样式模拟
  flex: 0,
  height: 0,
  width: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  overflow: 'hidden'
}

export default function styleHelperMixin () {
  return {
    methods: {
      __trackPageSizeCount () {
        return global.__mpxPageSizeCountMap[this.__pageId]
      },
      __trackExternalClassesVersion () {
        return this.__mpxProxy.externalClassesVersion.value
      },
      __getClass (staticClass, dynamicClass) {
        return concat(staticClass, stringifyDynamicClass(dynamicClass))
      },
      __getStyle (staticClass, dynamicClass, staticStyle, dynamicStyle, hide) {
        let idTotal = -1
        if (__mpx_perf_framework__) idTotal = perf.scopeStart('instance:render:getStyle')

        // 重置依赖标记
        dependentWindowSize = false
        const isNativeStaticStyle = staticStyle && isNativeStyle(staticStyle)

        const { mergeToLayer, mergeToLayerWithStyles, genResult } = createLayer(isNativeStaticStyle)

        if (staticClass || dynamicClass) {
          let idClass = -1
          if (__mpx_perf_framework__) idClass = perf.scopeStart('instance:render:getStyle:class')
          let needAddUnoPreflight = false
          // todo 当前为了复用小程序unocss产物，暂时进行mpEscape，等后续正式支持unocss后可不进行mpEscape
          const classString = concat(staticClass, stringifyDynamicClass(dynamicClass))

          classString.split(/\s+/).forEach((className) => {
            let localStyle, appStyle, unoStyle, unoVarStyle
            if (localStyle = this.__getClassStyle?.(className)) {
              mergeToLayer(localStyle._layer || 'normal', localStyle, getMediaStyle(localStyle._media))
              dependentWindowSize = dependentWindowSize || localStyle._dependentWindowSize
            } else if (unoStyle = global.__getUnoStyle?.(className)) {
              mergeToLayer(unoStyle._layer || 'uno', unoStyle, getMediaStyle(unoStyle._media))
              dependentWindowSize = dependentWindowSize || unoStyle._dependentWindowSize
              if (unoStyle.transform || unoStyle.filter) needAddUnoPreflight = true
            } else if (unoVarStyle = global.__getUnoVarStyle?.(className)) {
              mergeToLayer('important', unoVarStyle)
              dependentWindowSize = dependentWindowSize || unoVarStyle._dependentWindowSize
            } else if (appStyle = global.__getAppClassStyle?.(className)) {
              mergeToLayer(appStyle._layer || 'app', appStyle, getMediaStyle(appStyle._media))
              dependentWindowSize = dependentWindowSize || appStyle._dependentWindowSize
            } else if (global.__externalClasses?.includes(className)) {
              // 始终读取版本号，确保 externalClasses 从无到有时也能触发样式重算。
              this.__trackExternalClassesVersion()
              const externalClassStyle = this.__props[className]
              if (isObject(externalClassStyle)) {
                mergeToLayer('normal', externalClassStyle)
              }
            }
          })

          if (needAddUnoPreflight) {
            const unoPreflightStyle = global.__getAppClassStyle?.('__uno_preflight')
            mergeToLayer('preflight', unoPreflightStyle)
            dependentWindowSize = dependentWindowSize || unoPreflightStyle._dependentWindowSize
          }

          if (__mpx_perf_framework__) perf.scopeEnd(idClass)
        }

        if (staticStyle || dynamicStyle) {
          let idStyle = -1
          if (__mpx_perf_framework__) idStyle = perf.scopeStart('instance:render:getStyle:style')

          if (isNativeStaticStyle) {
            if (Array.isArray(staticStyle)) {
              mergeToLayerWithStyles('normal', staticStyle)
            } else {
              mergeToLayer('normal', staticStyle)
            }
          } else {
            mergeToLayer('normal', transformStyleObj(parseStyleText(staticStyle)))
          }

          mergeToLayer('normal', transformStyleObj(normalizeDynamicStyle(dynamicStyle)))

          if (__mpx_perf_framework__) perf.scopeEnd(idStyle)
        }

        if (hide) {
          mergeToLayer('important', HIDE_STYLE)
        }

        const result = genResult()

        const isEmpty = isNativeStaticStyle ? !result.length : isEmptyObject(result)

        // 仅在依赖窗口尺寸时才建立响应式关联，避免窗口尺寸变化时不必要的性能损耗
        if (dependentWindowSize) {
          this.__trackPageSizeCount()
        }
        if (__mpx_perf_framework__) perf.scopeEnd(idTotal)
        return isEmpty ? empty : result
      }
    }
  }
}
