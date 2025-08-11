import { isObject, isArray, dash2hump, cached, isEmptyObject } from '@mpxjs/utils'
import { Dimensions, StyleSheet } from 'react-native'
import Mpx from '../../index'

const rawDimensions = {
  screen: Dimensions.get('screen'),
  window: Dimensions.get('window')
}
let width, height

// TODO 临时适配折叠屏场景适配
// const isLargeFoldableLike = (__mpx_mode__ === 'android') && (height / width < 1.5) && (width > 600)
// if (isLargeFoldableLike) width = width / 2

function customDimensions (dimensions) {
  if (typeof Mpx.config.rnConfig?.customDimensions === 'function') {
    dimensions = Mpx.config.rnConfig.customDimensions(dimensions) || dimensions
  }
  width = dimensions.screen.width
  height = dimensions.screen.height
}

Dimensions.addEventListener('change', customDimensions)

function rpx (value) {
  // rn 单位 dp = 1(css)px =  1 物理像素 * pixelRatio(像素比)
  // px = rpx * (750 / 屏幕宽度)
  return value * width / 750
}
function vw (value) {
  return value * width / 100
}
function vh (value) {
  return value * height / 100
}

const unit = {
  rpx,
  vw,
  vh
}

const empty = {}

function formatValue (value) {
  if (width === undefined) customDimensions(rawDimensions)
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

export default function styleHelperMixin () {
  return {
    methods: {
      __getClass (staticClass, dynamicClass) {
        return concat(staticClass, stringifyDynamicClass(dynamicClass))
      },
      __getStyle (staticClass, dynamicClass, staticStyle, dynamicStyle, hide) {
        const result = {}
        const classMap = this.__getClassMap?.() || {}
        const appClassMap = global.__getAppClassMap?.() || {}

        if (staticClass || dynamicClass) {
          // todo 当前为了复用小程序unocss产物，暂时进行mpEscape，等后续正式支持unocss后可不进行mpEscape
          const classString = mpEscape(concat(staticClass, stringifyDynamicClass(dynamicClass)))
          classString.split(/\s+/).forEach((className) => {
            if (classMap[className]) {
              Object.assign(result, classMap[className])
            } else if (appClassMap[className]) {
              // todo 全局样式在每个页面和组件中生效，以支持全局原子类，后续支持样式模块复用后可考虑移除
              Object.assign(result, appClassMap[className])
            } else if (isObject(this.__props[className])) {
              // externalClasses必定以对象形式传递下来
              Object.assign(result, this.__props[className])
            }
          })
        }

        if (staticStyle || dynamicStyle) {
          const styleObj = Object.assign({}, parseStyleText(staticStyle), normalizeDynamicStyle(dynamicStyle))
          Object.assign(result, transformStyleObj(styleObj))
        }

        if (hide) {
          Object.assign(result, {
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

        return isEmptyObject(result) ? empty : result
      }
    }
  }
}
