import { isObject, isArray, dash2hump, cached, isEmptyObject, hasOwn, getFocusedNavigation } from '@mpxjs/utils'
import { StyleSheet, Dimensions } from 'react-native'
import { reactive } from '../../observer/reactive'
import Mpx from '../../index'

global.__mpxAppDimensionsInfo = {
  window: Dimensions.get('window'),
  screen: Dimensions.get('screen')
}
global.__mpxSizeCount = 0
global.__mpxPageSizeCountMap = reactive({})

global.__GCC = function (className, classMap, classMapValueCache) {
  if (!classMapValueCache.has(className)) {
    const styleObj = classMap[className]?.(global.__formatValue)
    styleObj && classMapValueCache.set(className, styleObj)
  }
  return classMapValueCache.get(className)
}

let dimensionsInfoInitialized = false
function useDimensionsInfo (dimensions) {
  dimensionsInfoInitialized = true
  if (typeof Mpx.config.rnConfig?.customDimensions === 'function') {
    dimensions = Mpx.config.rnConfig.customDimensions(dimensions) || dimensions
  }
  global.__mpxAppDimensionsInfo.window = dimensions.window
  global.__mpxAppDimensionsInfo.screen = dimensions.screen
}

function getPageSize (window = global.__mpxAppDimensionsInfo.screen) {
  return window.width + 'x' + window.height
}

Dimensions.addEventListener('change', ({ window, screen }) => {
  const oldScreen = getPageSize(global.__mpxAppDimensionsInfo.screen)
  useDimensionsInfo({ window, screen })

  // 对比 screen 高宽是否存在变化
  if (getPageSize(screen) === oldScreen) return

  global.__classCaches?.forEach(cache => cache?.clear())

  // 更新全局和栈顶页面的标记，其他后台页面的标记在show之后更新
  global.__mpxSizeCount++

  const navigation = getFocusedNavigation()

  if (navigation) {
    global.__mpxPageSizeCountMap[navigation.pageId] = global.__mpxSizeCount
    if (hasOwn(global.__mpxPageStatusMap, navigation.pageId)) {
      global.__mpxPageStatusMap[navigation.pageId] = `resize${global.__mpxSizeCount}`
    }
  }
})

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
  if (!dimensionsInfoInitialized) useDimensionsInfo(global.__mpxAppDimensionsInfo)
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

const createLayer = (isNativeStyle) => {
  const layerMap = {
    preflight: isNativeStyle ? [] : {},
    app: isNativeStyle ? [] : {},
    uno: isNativeStyle ? [] : {},
    normal: isNativeStyle ? [] : {},
    important: isNativeStyle ? [] : {}
  }

  const genResult = () => {
    if (isNativeStyle) {
      return [
        ...layerMap.preflight,
        ...layerMap.app,
        ...layerMap.uno,
        ...layerMap.normal,
        ...layerMap.important
      ]
    } else {
      return Object.assign({}, layerMap.preflight, layerMap.app, layerMap.uno, layerMap.normal, layerMap.important)
    }
  }

  const mergeToLayer = (name, ...classObjs) => {
    const layer = layerMap[name] || layerMap.normal
    return isNativeStyle ? layer.push(...classObjs) : Object.assign(layer, ...classObjs)
  }

  return {
    mergeToLayer,
    layerMap,
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
      __getSizeCount () {
        return global.__mpxPageSizeCountMap[this.__pageId]
      },
      __getClass (staticClass, dynamicClass) {
        return concat(staticClass, stringifyDynamicClass(dynamicClass))
      },
      __getStyle (staticClass, dynamicClass, staticStyle, dynamicStyle, hide) {
        const isNativeStaticStyle = staticStyle && isNativeStyle(staticStyle)

        const { mergeToLayer, genResult } = createLayer(isNativeStaticStyle)

         this.__getSizeCount()

        if (staticClass || dynamicClass) {
          const classString = concat(staticClass, stringifyDynamicClass(dynamicClass))

          let needAddUnoPreflight = false

          classString.split(/\s+/).forEach((className) => {
            let localStyle, appStyle, unoStyle, unoVarStyle
            if (localStyle = this.__getClassStyle?.(className)) {
              if (localStyle._media?.length) {
                mergeToLayer(localStyle._layer || 'normal', localStyle._default, getMediaStyle(localStyle._media))
              } else {
                mergeToLayer(localStyle._layer || 'normal', localStyle)
              }
            } else if (unoStyle = global.__getUnoStyle(className)) {
                if (unoStyle._media?.length) {
                  mergeToLayer(unoStyle.__layer || 'uno', unoStyle._default, getMediaStyle(unoStyle._media))
                } else {
                  mergeToLayer(unoStyle.__layer || 'uno', unoStyle)
                }
                if (unoStyle.transform || unoStyle.filter) needAddUnoPreflight = true
            } else if (unoVarStyle = global.__getUnoVarStyle(className)) {
                mergeToLayer('important', unoVarStyle)
            } else if (appStyle = global.__getAppClassStyle?.(className)) {
              if (appStyle._media?.length) {
                mergeToLayer(appStyle._layer || 'app', appStyle._default, getMediaStyle(appStyle._media))
              } else {
                mergeToLayer(appStyle._layer || 'app', appStyle)
              }
            } else if (isObject(this.__props[className])) {
              // externalClasses必定以对象形式传递下来
              mergeToLayer('normal', this.__props[className])
            }
          })

          if (needAddUnoPreflight) {
            mergeToLayer('preflight', global.__getAppClassStyle?.('__uno_preflight'))
          }
        }

        if (staticStyle || dynamicStyle) {
          const styleObj = {}
          if (isNativeStaticStyle) {
            if (Array.isArray(staticStyle)) {
              mergeToLayer('normal', ...staticStyle)
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
          mergeToLayer('important', HIDE_STYLE)
        }

        const result = genResult()

        const isEmpty = isNativeStaticStyle ? !result.length : isEmptyObject(result)

        return isEmpty ? empty : result
      }
    }
  }
}
