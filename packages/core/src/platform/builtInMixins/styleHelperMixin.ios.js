import { isObject, isArray, dash2hump, cached, isEmptyObject, hasOwn } from '@mpxjs/utils'
import { StyleSheet } from 'react-native'

// TODO: 1 目前测试鸿蒙下折叠屏screen固定为展开状态下屏幕尺寸，仅window会变化，且window包含状态栏高度
// TODO: 2 存在部分安卓折叠屏机型在折叠/展开切换时，Dimensions监听到的width/height尺寸错误，并触发多次问题
function rpx (value) {
  const screenInfo = global.__mpxAppDimensionsInfo.screen
  // rn 单位 dp = 1(css)px =  1 物理像素 * pixelRatio(像素比)
  // px = rpx * (750 / 屏幕宽度)
  return value * screenInfo.width / 750
}
function vw (value) {
  const screenInfo = global.__mpxAppDimensionsInfo.screen
  return value * screenInfo.width / 100
}
function vh (value) {
  const screenInfo = global.__mpxAppDimensionsInfo.screen
  return value * screenInfo.height / 100
}

const unit = {
  rpx,
  vw,
  vh
}

const empty = {}

function formatValue (value, unitType) {
  if (unitType === 'hairlineWidth') {
    return StyleSheet.hairlineWidth
  }
  if (unitType && typeof unit[unitType] === 'function') {
    return unit[unitType](+value)
  }
  const matched = unitRegExp.exec(value)
  if (matched) {
    if (!matched[2] || matched[2] === 'px') {
      return +matched[1]
    } else {
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
  if (!media || !media.length) return {}
  const { width } = global.__mpxAppDimensionsInfo.screen
  return media.reduce((styleObj, item) => {
    const { options = {}, value = {} } = item
    const { minWidth, maxWidth } = options
    if (!isNaN(minWidth) && !isNaN(maxWidth) && width >= minWidth && width <= maxWidth) {
      Object.assign(styleObj, value)
    } else if (!isNaN(minWidth) && width >= minWidth) {
      Object.assign(styleObj, value)
    } else if (!isNaN(maxWidth) && width <= maxWidth) {
      Object.assign(styleObj, value)
    }
    return styleObj
  }, {})
}

export default function styleHelperMixin () {
  return {
    watch: {
      __dimensionsChangeFlag () {
        this.$rawOptions.options?.__classMapValueCache?.clear()
      }
    },
    methods: {
      __getClass (staticClass, dynamicClass) {
        return concat(staticClass, stringifyDynamicClass(dynamicClass))
      },
      __getStyle (staticClass, dynamicClass, staticStyle, dynamicStyle, hide) {
        const isNativeStaticStyle = staticStyle && isNativeStyle(staticStyle)
        let result = isNativeStaticStyle ? [] : {}
        const mergeResult = isNativeStaticStyle ? (...args) => result.push(...args) : (...args) => Object.assign(result, ...args)

        const classMap = this.__getClassMap?.() || {}
        const appClassMap = global.__getAppClassMap?.() || {}
        // 使用一下 __dimensionsChangeFlag触发其get，需保证不会被压缩插件移除
        ;(() => this.__dimensionsChangeFlag)()

        if (staticClass || dynamicClass) {
          // todo 当前为了复用小程序unocss产物，暂时进行mpEscape，等后续正式支持unocss后可不进行mpEscape
          const classString = mpEscape(concat(staticClass, stringifyDynamicClass(dynamicClass)))

          classString.split(/\s+/).forEach((className) => {
            if (classMap[className]) {
              const styleObj = classMap[className] || empty
              if (styleObj._media.length) {
                mergeResult(styleObj._default, getMediaStyle(styleObj._media))
              } else {
                mergeResult(styleObj._default)
              }
            } else if (appClassMap[className]) {
              // todo 全局样式在每个页面和组件中生效，以支持全局原子类，后续支持样式模块复用后可考虑移除
              const styleObj = appClassMap[className] || empty
              if (styleObj._media.length) {
                mergeResult(styleObj._default, getMediaStyle(styleObj._media))
              } else {
                mergeResult(styleObj._default)
              }
            } else if (isObject(this.__props[className])) {
              // externalClasses必定以对象形式传递下来
              mergeResult(this.__props[className])
            }
          })
        }

        if (staticStyle || dynamicStyle) {
          const styleObj = {}
          if (isNativeStaticStyle) {
            if (Array.isArray(staticStyle)) {
              result = result.concat(staticStyle)
            } else {
              mergeResult(staticStyle)
            }
          } else {
            Object.assign(styleObj, parseStyleText(staticStyle))
          }
          Object.assign(styleObj, normalizeDynamicStyle(dynamicStyle))
          mergeResult(transformStyleObj(styleObj))
        }

        if (hide) {
          mergeResult({
            // display: 'none'
            // RN下display:'none'容易引发未知异常问题，使用布局样式模拟
            flex: 0,
            height: 0,
            width: 0,
            padding: 0,
            margin: 0,
            overflow: 'hidden'
          })
        }
        const isEmpty = isNativeStaticStyle ? !result.length : isEmptyObject(result)
        return isEmpty ? empty : result
      }
    }
  }
}
