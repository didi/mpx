import { isObject, isArray, dash2hump, cached, isEmptyObject, hasOwn } from '@mpxjs/utils'
import { StyleSheet, Dimensions } from 'react-native'
import { reactive } from '../../observer/reactive'
import { getDimensionsInfo, syncDimensions } from '../dimensionsHelper'

global.__mpxSizeCount = 0
global.__mpxPageSizeCountMap = reactive({ __standalone: 0 })

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

global.getDimensionsInfo = base => Object.assign({}, getDimensionsInfo(base))

Dimensions.addEventListener('change', syncDimensions)

// TODO: 存在部分安卓折叠屏机型在折叠/展开切换时，Dimensions 监听到的 width/height 尺寸错误，并触发多次问题
function rpx (value) {
  // rn 单位 dp = 1(css)px =  1 物理像素 * pixelRatio(像素比)
  // px = rpx * (样式计算宽度 / 750)
  return value * getDimensionsInfo().width / 750
}
function vw (value) {
  return value * getDimensionsInfo().width / 100
}
function vh (value) {
  return value * getDimensionsInfo().height / 100
}

const unit = {
  rpx,
  vw,
  vh
}

const empty = {}

// 记录 style 是否依赖窗口尺寸
let dependentWindowSize = false
function formatValue (value, unitType) {
  if (unitType === 'hairlineWidth') {
    return StyleSheet.hairlineWidth
  }
  if (unitType && typeof unit[unitType] === 'function') {
    dependentWindowSize = true
    return unit[unitType](+value)
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
  if (hairlineRegExp.test(value)) return StyleSheet.hairlineWidth
  return value
}

global.__formatValue = formatValue

const escapeReg = /[()[\]{}#!.:,%'"+$]/g
const escapeMap = {
  '(': '_pl_',
  ')': '_pr_',
  '[': '_bl_',
  ']': '_br_',
  '{': '_cl_',
  '}': '_cr_',
  '#': '_h_',
  '!': '_i_',
  '/': '_s_',
  '.': '_d_',
  ':': '_c_',
  ',': '_2c_',
  '%': '_p_',
  '\'': '_q_',
  '"': '_dq_',
  '+': '_a_',
  $: '_si_'
}

const mpEscape = cached((str) => {
  return str.replace(escapeReg, function (match) {
    if (escapeMap[match]) return escapeMap[match]
    // unknown escaped
    return '_u_'
  })
})

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
const unitRegExp = /^\s*(-?\d+(?:\.\d+)?)(rpx|vw|vh|px)?\s*$/
const hairlineRegExp = /^\s*hairlineWidth\s*$/
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
    transformed[prop] = formatValue(styleObj[prop])
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
  if (!media || !media.length) return
  dependentWindowSize = true
  const { width } = getDimensionsInfo()
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
    if (style?._inlineLayer) checkInlineLayer(style, mergeToLayer)
    if (mediaStyle) {
      layer.push(mediaStyle)
      if (mediaStyle._inlineLayer) checkInlineLayer(mediaStyle, mergeToLayer)
    }
  }

  const mergeToLayerWithStyles = (name, styles) => {
    styles.forEach(v => mergeToLayer(name, v))
  }

  const genResult = isNativeStyle
    ? () => {
        return [
          ...layerMap.normal,
          ...layerMap.important
        ]
      }
    : () => {
        const res = Object.assign(
          {},
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

export default function styleHelperMixin () {
  return {
    methods: {
      __trackPageSizeCount () {
        return global.__mpxPageSizeCountMap[this.__pageId == null ? '__standalone' : this.__pageId]
      },
      __trackExternalClassesVersion () {
        return this.__mpxProxy.externalClassesVersion.value
      },
      __getClass (staticClass, dynamicClass) {
        return concat(staticClass, stringifyDynamicClass(dynamicClass))
      },
      __getStyle (staticClass, dynamicClass, staticStyle, dynamicStyle, hide) {
        // 重置依赖标记
        dependentWindowSize = false
        const isNativeStaticStyle = staticStyle && isNativeStyle(staticStyle)

        const { mergeToLayer, mergeToLayerWithStyles, genResult } = createLayer(isNativeStaticStyle)

        if (staticClass || dynamicClass) {
          // todo 当前为了复用小程序unocss产物，暂时进行mpEscape，等后续正式支持unocss后可不进行mpEscape
          const classString = mpEscape(concat(staticClass, stringifyDynamicClass(dynamicClass)))

          classString.split(/\s+/).forEach((className) => {
            let localStyle, appStyle
            if (localStyle = this.__getClassStyle?.(className)) {
              mergeToLayer('normal', localStyle, getMediaStyle(localStyle._media))
              dependentWindowSize = dependentWindowSize || localStyle._dependentWindowSize
            } else if (appStyle = global.__getAppClassStyle?.(className)) {
              mergeToLayer('normal', appStyle, getMediaStyle(appStyle._media))
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
        }

        if (staticStyle || dynamicStyle) {
          const styleObj = {}
          if (isNativeStaticStyle) {
            if (Array.isArray(staticStyle)) {
              mergeToLayerWithStyles('normal', staticStyle)
            } else {
              mergeToLayer('normal', staticStyle)
            }
          } else {
            Object.assign(styleObj, parseStyleText(staticStyle))
          }
          Object.assign(styleObj, normalizeDynamicStyle(dynamicStyle))
          mergeToLayer('normal', transformStyleObj(styleObj))
        }

        if (hide) {
          mergeToLayer('important', {
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
          })
        }
        const result = genResult()
        const isEmpty = isNativeStaticStyle ? !result.length : isEmptyObject(result)

        // 仅在依赖窗口尺寸时才建立响应式关联，避免窗口尺寸变化时不必要的性能损耗
        if (dependentWindowSize) {
          this.__trackPageSizeCount()
        }
        return isEmpty ? empty : result
      }
    }
  }
}
