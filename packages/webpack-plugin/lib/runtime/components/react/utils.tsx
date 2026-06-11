import { useEffect, useCallback, useMemo, useRef, ReactNode, ReactElement, isValidElement, useContext, useState, Dispatch, SetStateAction, createElement, MutableRefObject } from 'react'
import { LayoutChangeEvent, TextStyle, ImageProps, Image } from 'react-native'
import { isObject, isFunction, isNumber, hasOwn, diffAndCloneA, error, warn } from '@mpxjs/utils'
import { VarContext, ScrollViewContext, RouteContext, TextPassThroughContext, TextPassThroughContextValue } from './context'
import { ExpressionParser, parseFunc, ReplaceSource } from './parser'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import type { AnyFunc, ExtendedFunctionComponent } from './types/common'
import { Gesture } from 'react-native-gesture-handler'

// ============================================================
// declare + constants
// ============================================================

declare const __mpx_mode__: 'ios' | 'android' | 'harmony'

export const percentRegExp = /^\s*-?\d+(\.\d+)?%\s*$/
export const svgRegExp = /\.svg(?:[?#].*)?$/i
export const hiddenStyle = {
  opacity: 0
}
export const isIOS = __mpx_mode__ === 'ios'
export const isAndroid = __mpx_mode__ === 'android'
export const isHarmony = __mpx_mode__ === 'harmony'
export const extendObject = Object.assign

const textStyleMap: Record<string, boolean> = {
  color: true,
  letterSpacing: true,
  lineHeight: true,
  includeFontPadding: true,
  writingDirection: true
}
const urlRegExp = /^\s*url\(["']?(.*?)["']?\)\s*$/
const linearGradientRegExp = /^\s*linear-gradient\(.*\)\s*$/
const digitStartRegExp = /^\d/
const varDecRegExp = /^--/
const varUseRegExp = /var\(/
const unoVarDecRegExp = /^--un-/
const unoVarUseRegExp = /var\(--un-/
const calcUseRegExp = /calc\(/
const envUseRegExp = /env\(/
const defaultBoxSizingStyle = {
  boxSizing: 'content-box'
}
const backgroundStyleMap: Record<string, boolean> = {
  backgroundImage: true,
  backgroundSize: true,
  backgroundRepeat: true,
  backgroundPosition: true
}
const textPropsMap: Record<string, boolean> = {
  ellipsizeMode: true,
  numberOfLines: true
}
const boxSizingAffectingStyleMap: Record<string, boolean> = {
  padding: true,
  paddingTop: true,
  paddingRight: true,
  paddingBottom: true,
  paddingLeft: true,
  borderWidth: true,
  borderTopWidth: true,
  borderRightWidth: true,
  borderBottomWidth: true,
  borderLeftWidth: true,
  border: true,
  borderTop: true,
  borderRight: true,
  borderBottom: true,
  borderLeft: true
}
const runtimeAbbreviationMap: Record<string, string[]> = {
  margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
  padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
  borderRadius: ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'],
  borderWidth: ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'],
  borderColor: ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'],
  border: ['borderWidth', 'borderStyle', 'borderColor'],
  borderTop: ['borderTopWidth', 'borderTopStyle', 'borderTopColor'],
  borderRight: ['borderRightWidth', 'borderRightStyle', 'borderRightColor'],
  borderBottom: ['borderBottomWidth', 'borderBottomStyle', 'borderBottomColor'],
  borderLeft: ['borderLeftWidth', 'borderLeftStyle', 'borderLeftColor'],
  flexFlow: ['flexDirection', 'flexWrap'],
  textShadow: ['textShadowOffset.width', 'textShadowOffset.height', 'textShadowRadius', 'textShadowColor'],
  textDecoration: ['textDecorationLine', 'textDecorationStyle', 'textDecorationColor']
}
const runtimeCompositeStyleMap: Record<string, boolean> = {
  margin: true,
  padding: true,
  borderRadius: true,
  borderWidth: true,
  borderColor: true
}
const safeAreaInsetMap: Record<string, 'top' | 'right' | 'bottom' | 'left'> = {
  'safe-area-inset-top': 'top',
  'safe-area-inset-right': 'right',
  'safe-area-inset-bottom': 'bottom',
  'safe-area-inset-left': 'left'
}
const radiusPercentRule: Record<string, 'height' | 'width'> = {
  borderTopLeftRadius: 'width',
  borderBottomLeftRadius: 'width',
  borderBottomRightRadius: 'width',
  borderTopRightRadius: 'width',
  borderRadius: 'width'
}
const selfPercentRule: Record<string, 'height' | 'width'> = extendObject({
  translateX: 'width',
  translateY: 'height'
}, radiusPercentRule)
const parentHeightPercentRule: Record<string, boolean> = {
  height: true,
  minHeight: true,
  maxHeight: true,
  top: true,
  bottom: true
}
const bgRepeatMap: Record<string, boolean> = {
  repeat: true,
  'repeat-x': true,
  'repeat-y': true,
  'no-repeat': true
}
const bgPositionMap: Record<string, boolean> = {
  left: true,
  right: true,
  top: true,
  bottom: true,
  center: true
}

// ============================================================
// interfaces / types
// ============================================================

interface PercentConfig {
  fontSize?: number | string
  width?: number
  height?: number
  parentFontSize?: number
  parentWidth?: number
  parentHeight?: number
}

interface PositionMeta {
  hasPositionFixed: boolean
}

interface TransformStyleConfig {
  enableVar?: boolean
  parentFontSize?: number
  parentWidth?: number
  parentHeight?: number
  transformRadiusPercent?: boolean
}

export interface VisitorArg {
  target: Record<string, any>
  key: string
  value: any
  keyPath: Array<string>
}

type GroupData<T> = Record<string, Partial<T>>

interface LayoutConfig {
  props: Record<string, any>
  hasSelfPercent: boolean
  setWidth?: Dispatch<SetStateAction<number>>
  setHeight?: Dispatch<SetStateAction<number>>
  onLayout?: (event?: LayoutChangeEvent) => void
  nodeRef: React.RefObject<any>
}

export interface WrapChildrenConfig {
  hasVarDec: boolean
  varContext?: Record<string, any>
  textPassThrough?: TextPassThroughContextValue | null
}

export interface TextPassThroughValueOptions {
  enableTextPassThrough?: boolean
}

export interface GestureHandler {
  nodeRefs?: Array<{ getNodeInstance: () => { nodeRef: unknown } }>
  current?: unknown
}

// ============================================================
// generic utility functions
// ============================================================

export function omit<T, K extends string> (obj: T, fields: K[]): Omit<T, K> {
  const shallowCopy: any = extendObject({}, obj)
  for (let i = 0; i < fields.length; i += 1) {
    const key = fields[i]
    delete shallowCopy[key]
  }
  return shallowCopy
}

export const parseUrl = (cssUrl = '') => {
  if (!cssUrl) return
  const match = cssUrl.match(urlRegExp)
  return match?.[1]
}

export const getRestProps = (transferProps: any = {}, originProps: any = {}, deletePropsKey: any = []) => {
  return extendObject(
    {},
    transferProps,
    omit(originProps, deletePropsKey)
  )
}

export function getDefaultAllowFontScaling (): boolean {
  return global.__mpx?.config?.rnConfig?.allowFontScaling ?? false
}

export function isText (ele: ReactNode): ele is ReactElement {
  if (isValidElement(ele)) {
    const displayName = (ele.type as ExtendedFunctionComponent)?.displayName
    const isCustomText = (ele.type as ExtendedFunctionComponent)?.isCustomText
    return displayName === 'MpxText' || displayName === 'MpxSimpleText' || displayName === 'MpxInlineText' || displayName === 'Text' || !!isCustomText
  }
  return false
}

export function isStringChildren (children: ReactNode) {
  if (typeof children === 'string') return true
  if (!Array.isArray(children)) return false
  return children.every((child) => typeof child === 'string')
}

export function groupBy<T extends Record<string, any>> (
  obj: T,
  callback: (key: string, val: T[keyof T]) => string,
  group: GroupData<T> = {}
): GroupData<T> {
  Object.entries(obj).forEach(([key, val]) => {
    const groupKey = callback(key, val)
    group[groupKey] = group[groupKey] || {}
    group[groupKey][key as keyof T] = val
  })
  return group
}

// 多value解析
export function parseValues (str: string, char = ' ') {
  let stack = 0
  let temp = ''
  const result = []
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') {
      stack++
    } else if (str[i] === ')') {
      stack--
    }
    // 非括号内 或者 非分隔字符且非空
    if (stack !== 0 || str[i] !== char) {
      temp += str[i]
    }
    if ((stack === 0 && str[i] === char) || i === str.length - 1) {
      result.push(temp.trim())
      temp = ''
    }
  }
  return result
}

export const debounce = <T extends AnyFunc> (
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { clear: () => void } => {
  let timer: any
  const wrapper = (...args: ReadonlyArray<any>) => {
    timer && clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, delay)
  }
  wrapper.clear = () => {
    timer && clearTimeout(timer)
    timer = null
  }
  return wrapper
}

// ============================================================
// style classification & splitting
// ============================================================

function isTextStyle (key: string) {
  return hasOwn(textStyleMap, key) || key.startsWith('font') || key.startsWith('text')
}

function isColorValue (token: string): boolean {
  if (token.startsWith('#') || token.startsWith('rgb(') || token.startsWith('rgba(') || token.startsWith('hsl(') || token.startsWith('hsla(')) return true
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return hasOwn(require('./namedColorSet').default, token.toLowerCase())
}

function getSafeAreaInset (name: string, navigation: Record<string, any> | undefined) {
  const insets = extendObject({}, initialWindowMetrics?.insets, navigation?.insets)
  return insets[safeAreaInsetMap[name]]
}

export function isBoxSizingAffectingStyle (key: string) {
  return hasOwn(boxSizingAffectingStyleMap, key)
}

export function transformBoxSizing (style: Record<string, any> = {}, hasBoxSizingAffectingStyle = false) {
  if (hasBoxSizingAffectingStyle && style.boxSizing === undefined) {
    style.boxSizing = global.__mpx?.config?.rnConfig?.defaultBoxSizing ?? defaultBoxSizingStyle.boxSizing
  }
}

export function splitStyle<T extends Record<string, any>> (styleObj: T, sideEffect?: (key: string, val: T[keyof T]) => void): {
  textStyle?: Partial<T>
  backgroundStyle?: Partial<T>
  innerStyle?: Partial<T>
} {
  return groupBy(styleObj, (key, val) => {
    sideEffect && sideEffect(key, val)
    if (isTextStyle(key)) {
      return 'textStyle'
    } else if (hasOwn(backgroundStyleMap, key)) {
      return 'backgroundStyle'
    } else {
      return 'innerStyle'
    }
  })
}

export function splitProps<T extends Record<string, any>> (props: T): {
  textProps?: Partial<T>
  innerProps?: Partial<T>
} {
  return groupBy(props, (key) => {
    if (hasOwn(textPropsMap, key)) {
      return 'textProps'
    } else {
      return 'innerProps'
    }
  }) as {
    textProps: Partial<T>
    innerProps: Partial<T>
  }
}

export function pickStyle (styleObj: Record<string, any> = {}, pickedKeys: Array<string>, callback?: (key: string, val: number | string) => number | string) {
  return pickedKeys.reduce<Record<string, any>>((acc, key) => {
    if (key in styleObj) {
      acc[key] = callback ? callback(key, styleObj[key]) : styleObj[key]
    }
    return acc
  }, {})
}

// ============================================================
// style transform pipeline
// ============================================================

// --- var ---

function resolveVar (input: string, varContext: Record<string, any>) {
  const parsed = parseFunc(input, 'var')
  const replaced = new ReplaceSource(input)

  for (const { start, end, args } of parsed) {
    // NOTE:
    // - CSS var() fallback 允许包含空格、逗号等字符（如 font-family 的 fallback）
    // - parseFunc 会按逗号分割 args，因此这里把 args[1..] 重新 join 回 fallback
    const varName = args[0]
    const fallback: string | undefined = args.length > 1 ? args.slice(1).join(',').trim() : undefined

    // 先处理 varValue
    let varValue = hasOwn(varContext, varName) ? varContext[varName] : undefined
    if (varValue !== undefined) {
      varValue = varUseRegExp.test(varValue) ? resolveVar(varValue, varContext) : global.__formatValue(varValue)
    }
    // 再处理 fallback
    if (varValue === undefined && fallback !== undefined) {
      varValue = varUseRegExp.test(fallback) ? resolveVar(fallback, varContext) : global.__formatValue(fallback)
    }
    if (varValue === undefined) return
    replaced.replace(start, end - 1, varValue)
  }

  return global.__formatValue(replaced.source())
}

function transformVar (styleObj: Record<string, any>, varKeyPaths: Array<Array<string>>, varContext: Record<string, any>, visitOther: (arg: VisitorArg) => void) {
  varKeyPaths.forEach((varKeyPath) => {
    setStyle(styleObj, varKeyPath, ({ target, key, value }) => {
      const resolved = resolveVar(value, varContext)
      if (resolved === undefined) {
        delete target[key]
        error(`Can not resolve css var at ${varKeyPath.join('.')}:${value}.`)
        return
      }
      target[key] = resolved
      visitOther({ target, key, value: target[key], keyPath: varKeyPath })
    })
  })
}

// --- env ---

function transformEnv (styleObj: Record<string, any>, envKeyPaths: Array<Array<string>>, navigation: Record<string, any> | undefined) {
  envKeyPaths.forEach((envKeyPath) => {
    setStyle(styleObj, envKeyPath, ({ target, key, value }) => {
      const parsed = parseFunc(value, 'env')
      const replaced = new ReplaceSource(value)
      parsed.forEach(({ start, end, args }) => {
        const name = args[0]
        const fallback = args[1] || ''
        const value = '' + (getSafeAreaInset(name, navigation) ?? global.__formatValue(fallback))
        replaced.replace(start, end - 1, value)
      })
      target[key] = global.__formatValue(replaced.source())
    })
  })
}

// --- percent ---

function resolvePercent (value: string | number | undefined, key: string, percentConfig: PercentConfig): string | number | undefined {
  if (!(typeof value === 'string' && percentRegExp.test(value))) return value
  let base
  let reason
  if (key === 'fontSize') {
    base = percentConfig.parentFontSize
    reason = 'parent-font-size'
  } else if (key === 'lineHeight') {
    base = resolvePercent(percentConfig.fontSize, 'fontSize', percentConfig)
    reason = 'font-size'
  } else if (selfPercentRule[key]) {
    base = percentConfig[selfPercentRule[key]]
    reason = selfPercentRule[key]
  } else if (parentHeightPercentRule[key]) {
    base = percentConfig.parentHeight
    reason = 'parent-height'
  } else {
    base = percentConfig.parentWidth
    reason = 'parent-width'
  }
  if (typeof base !== 'number') {
    error(`[${key}] can not contain % unit unless you set [${reason}] with a number for the percent calculation.`)
    return value
  } else {
    return parseFloat(value) / 100 * base
  }
}

function transformPercent (styleObj: Record<string, any>, percentKeyPaths: Array<Array<string>>, percentConfig: PercentConfig) {
  percentKeyPaths.forEach((percentKeyPath) => {
    setStyle(styleObj, percentKeyPath, ({ target, key, value }) => {
      target[key] = resolvePercent(value, key, percentConfig)
    })
  })
}

// --- calc ---

function transformCalc (styleObj: Record<string, any>, calcKeyPaths: Array<Array<string>>, formatter: (value: string, key: string) => number) {
  calcKeyPaths.forEach((calcKeyPath) => {
    setStyle(styleObj, calcKeyPath, ({ target, key, value }) => {
      const parsed = parseFunc(value, 'calc')
      const replaced = new ReplaceSource(value)
      parsed.forEach(({ start, end, args }) => {
        const exp = args[0]
        try {
          const result = new ExpressionParser(exp, (value) => {
            return formatter(value, key)
          }).parse()
          replaced.replace(start, end - 1, '' + result.value)
        } catch (e) {
          error(`calc(${exp}) parse error.`, undefined, e)
        }
      })
      target[key] = global.__formatValue(replaced.source())
    })
  })
}

// --- misc ---

function transformPosition (styleObj: Record<string, any>, meta: PositionMeta) {
  if (styleObj.position === 'fixed') {
    styleObj.position = 'absolute'
    meta.hasPositionFixed = true
  }
}

function transformStringify (styleObj: Record<string, any>) {
  if (isNumber(styleObj.fontWeight)) {
    styleObj.fontWeight = '' + styleObj.fontWeight
  }
  // transformOrigin 20px 需要转换为 transformOrigin '20'
  if (isNumber(styleObj.transformOrigin)) {
    styleObj.transformOrigin = '' + styleObj.transformOrigin
  }
}

// --- transform / shadow ---

// parse string transform, eg: transform: 'rotateX(45deg) rotateZ(0.785398rad)'
function parseTransform (transformStr: string) {
  const values = parseValues(transformStr)
  // Todo 2 RN下顺序不一致转换结果不一致，故这里不处理，动画前后transform 排序不一致的问题，由业务调整写法
  // Todo 1 transform 排序不一致时，transform动画会闪烁，故这里同样的排序输出 transform
  // values.sort()
  const transform: { [propName: string]: string | number | number[] }[] = []
  values.forEach(item => {
    const match = item.match(/([/\w]+)\((.+)\)/)
    if (match && match.length >= 3) {
      let key = match[1]
      const val = match[2]
      switch (key) {
        case 'rotateX':
        case 'rotateY':
        case 'rotateZ':
        case 'rotate':
        case 'skewX':
        case 'skewY':
          key = key === 'rotate' ? 'rotateZ' : key
          transform.push({ [key]: val })
          break
        case 'translateX':
        case 'translateY':
        case 'scaleX':
        case 'scaleY':
        case 'perspective':
          transform.push({ [key]: global.__formatValue(val) })
          break
        case 'matrix': {
          const matrixValues = parseValues(val, ',').map(v => +v.trim())
          if (matrixValues.length === 6) {
            const [a, b, c, d, tx, ty] = matrixValues
            transform.push({ matrix: [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1] })
          } else {
            error(`Transform matrix only supports 6 values in React Native, got ${matrixValues.length}`)
          }
          break
        }
        case 'matrix3d': {
          const matrixValues = parseValues(val, ',').map(v => +v.trim())
          if (matrixValues.length === 16) {
            transform.push({ matrix: matrixValues })
          } else {
            error(`Transform matrix only supports 16 values in React Native, got ${matrixValues.length}`)
          }
          break
        }
        case 'translate':
        case 'scale':
        case 'skew':
        case 'translate3d': // x y 支持 z不支持
        case 'scale3d': // x y 支持 z不支持
        {
          // 2 个以上的值处理
          key = key.replace('3d', '')
          const vals = parseValues(val, ',').splice(0, 3)
          // scale(.5) === scaleX(.5) scaleY(.5)
          if (vals.length === 1 && key === 'scale') {
            vals.push(vals[0])
          }
          const xyz = ['X', 'Y', 'Z']
          transform.push(...vals.map((v, index) => {
            return { [`${key}${xyz[index] || ''}`]: global.__formatValue(v.trim()) }
          }))
          break
        }
        case 'rotate3d': {
          const parts = parseValues(val, ',')
          if (parts.length === 4) {
            const x = +parts[0].trim()
            const y = +parts[1].trim()
            const z = +parts[2].trim()
            const angle = parts[3].trim()
            if (x && !y && !z) transform.push({ rotateX: angle })
            else if (!x && y && !z) transform.push({ rotateY: angle })
            else if (!x && !y && z) transform.push({ rotateZ: angle })
          } else {
            error(`Transform rotate3d only supports 4 values, got ${parts.length}`)
          }
          break
        }
        case 'translateZ':
        case 'scaleZ':
          break
      }
    }
  })
  return transform
}

// format style transform
function transformTransform (style: Record<string, any>) {
  if (!style.transform || Array.isArray(style.transform)) return
  style.transform = parseTransform(style.transform)
}

function transformBoxShadow (styleObj: Record<string, any>) {
  if (!styleObj.boxShadow) return
  styleObj.boxShadow = parseValues(styleObj.boxShadow).reduce((res, i, idx) => {
    let formatted: string | number
    // 需要保留 px 关键字，这里仅处理 rpx 转 px
    if (/\d+rpx$/.test(i)) {
      formatted = global.__formatValue(i) + 'px'
    } else {
      formatted = i
    }
    return `${res}${idx === 0 ? '' : ' '}${formatted}`
  }, '')
}

// --- shorthand ---

function expandCompositeValues (values: string[]): string[] {
  const v = values.slice(0, 4)
  switch (v.length) {
    case 1:
      return [v[0], v[0], v[0], v[0]]
    case 2:
      return [v[0], v[1], v[0], v[1]]
    case 3:
      return [v[0], v[1], v[2], v[1]]
    default:
      return v
  }
}

function expandAbbreviation (values: string[], props: string[]): Array<[string, any]> {
  const result: Array<[string, any]> = []
  const dotMap: Record<string, Record<string, any>> = {}
  for (let i = 0; i < props.length && i < values.length; i++) {
    const prop = props[i]
    const formatted = global.__formatValue(values[i])
    if (prop.includes('.')) {
      const [main, sub] = prop.split('.')
      if (!dotMap[main]) {
        dotMap[main] = {}
        result.push([main, dotMap[main]])
      }
      dotMap[main][sub] = formatted
    } else {
      result.push([prop, formatted])
    }
  }
  return result
}

function expandFlex (value: string): Array<[string, any]> | null {
  const values = parseValues(value)
  if (values.length === 0) return null
  if (values.length === 1) {
    if (values[0] === 'none') {
      return [['flexGrow', 0], ['flexShrink', 0]]
    }
    if (values[0] === 'initial') {
      return [['flexGrow', 0], ['flexShrink', 1]]
    }
  }
  const result: Array<[string, any]> = []
  let i = 0
  const isNum = (v: string) => !isNaN(+v)
  if (isNum(values[i])) {
    result.push(['flexGrow', +values[i++]])
  } else {
    result.push(['flexGrow', 1])
  }
  if (i < values.length && isNum(values[i])) {
    result.push(['flexShrink', +values[i++]])
  } else {
    result.push(['flexShrink', 1])
  }
  if (i < values.length) {
    if (values[i] !== 'auto') {
      result.push(['flexBasis', global.__formatValue(values[i])])
    }
  } else {
    result.push(['flexBasis', 0])
  }
  return result
}

function transformFlex (styleObj: Record<string, any>) {
  const value = styleObj.flex
  if (typeof value !== 'string') return
  const flexResult = expandFlex(value)
  if (!flexResult) return
  delete styleObj.flex
  for (const [prop, val] of flexResult) {
    if (!hasOwn(styleObj, prop)) styleObj[prop] = val
  }
}

function expandTextDecoration (values: string[]): string[] {
  const supportedLineValues = new Set(['none', 'underline', 'line-through'])
  const lineValues: string[] = []
  const otherValues: string[] = []
  for (const v of values) {
    if (supportedLineValues.has(v)) {
      lineValues.push(v)
    } else {
      otherValues.push(v)
    }
  }
  return lineValues.length > 0 ? [lineValues.join(' '), ...otherValues] : otherValues
}
// Todo 目前仅支持指定属性的简写值，且不同于编译时的 class 处理，暂不支持缺省值，后续优化
function transformShorthand (styleObj: Record<string, any>, shorthandKeys: string[]) {
  if (shorthandKeys.length === 0) return
  for (const key of shorthandKeys) {
    const value = styleObj[key]
    if (typeof value !== 'string') continue
    if ((key === 'border' || key === 'borderTop' || key === 'borderRight' || key === 'borderBottom' || key === 'borderLeft') && value.trim() === 'none') {
      const prop = runtimeAbbreviationMap[key][0]
      delete styleObj[key]
      if (!hasOwn(styleObj, prop)) styleObj[prop] = 0
      continue
    }
    const values = parseValues(value)
    const props = runtimeAbbreviationMap[key]
    if (!props) continue
    if (hasOwn(runtimeCompositeStyleMap, key) && values.length === 1) continue
    let expandedValues = values
    if (hasOwn(runtimeCompositeStyleMap, key)) {
      expandedValues = expandCompositeValues(values)
    } else if (key === 'textDecoration') {
      expandedValues = expandTextDecoration(values)
    }
    const pairs = expandAbbreviation(expandedValues, props)
    delete styleObj[key]
    for (const [prop, val] of pairs) {
      if (!hasOwn(styleObj, prop)) styleObj[prop] = val
    }
  }
}

// --- runtime alignment ---

function transformFontFamily (styleObj: Record<string, any>) {
  const value = styleObj.fontFamily
  if (typeof value !== 'string') return
  const stripped = value.replace(/["']/g, '').trim()
  if (!stripped) return
  const values = parseValues(stripped, ',')
  styleObj.fontFamily = values[0].trim()
}
function transOrderXY (values: string[]) {
  if (values.length === 2 && ['top', 'bottom'].includes(values[0])) {
    [values[0], values[1]] = [values[1], values[0]]
  }
  return values
}
function transformBackground (styleObj: Record<string, any>) {
  if (typeof styleObj.backgroundSize === 'string') {
    styleObj.backgroundSize = parseValues(styleObj.backgroundSize)
  }
  if (typeof styleObj.backgroundPosition === 'string') {
    const parts = parseValues(styleObj.backgroundPosition)
    styleObj.backgroundPosition = transOrderXY(parts.map(v => v === 'center' ? '50%' : v))
  }
  const value = styleObj.background
  if (typeof value !== 'string') return
  delete styleObj.background
  if (value === 'none') {
    styleObj.backgroundImage = 'none'
    styleObj.backgroundColor = 'transparent'
    return
  }
  const tokens = parseValues(value)
  const positionValues: string[] = []
  const sizeValues: string[] = []
  let isSize = false
  for (const token of tokens) {
    if (urlRegExp.test(token)) {
      styleObj.backgroundImage = token
    } else if (linearGradientRegExp.test(token)) {
      styleObj.backgroundImage = token
    } else if (hasOwn(bgRepeatMap, token)) {
      styleObj.backgroundRepeat = token
    } else if (isColorValue(token)) {
      styleObj.backgroundColor = token
    } else if (token === '/') {
      isSize = true
    } else {
      const slashParts = parseValues(token, '/')
      if (slashParts.length > 1) {
        const posPart = slashParts[0]
        if (posPart) positionValues.push(posPart === 'center' ? '50%' : posPart)
        isSize = true
        for (let i = 1; i < slashParts.length; i++) {
          if (slashParts[i]) sizeValues.push(slashParts[i])
        }
      } else if (isSize) {
        sizeValues.push(token)
      } else if (hasOwn(bgPositionMap, token) || percentRegExp.test(token) || digitStartRegExp.test(token)) {
        positionValues.push(token === 'center' ? '50%' : token)
      }
    }
  }
  if (positionValues.length) styleObj.backgroundPosition = transOrderXY(positionValues)
  if (sizeValues.length) styleObj.backgroundSize = sizeValues
}

// ============================================================
// style traversal
// ============================================================

export function traverseStyle (styleObj: Record<string, any>, visitors: Array<(arg: VisitorArg) => void>) {
  const keyPath: Array<string> = []
  function traverse<T extends Record<string, any>> (target: T) {
    if (Array.isArray(target)) {
      target.forEach((value, index) => {
        const key = String(index)
        keyPath.push(key)
        visitors.forEach(visitor => visitor({ target, key, value, keyPath }))
        traverse(value)
        keyPath.pop()
      })
    } else if (isObject(target)) {
      Object.entries(target).forEach(([key, value]) => {
        keyPath.push(key)
        visitors.forEach(visitor => visitor({ target, key, value, keyPath }))
        traverse(value)
        keyPath.pop()
      })
    }
  }
  traverse(styleObj)
}

export function setStyle (styleObj: Record<string, any>, keyPath: Array<string>, setter: (arg: VisitorArg) => void) {
  let target = styleObj
  const lastKey = keyPath[keyPath.length - 1]
  for (let i = 0; i < keyPath.length - 1; i++) {
    target = target[keyPath[i]]
    if (!target) return
  }
  setter({
    target,
    key: lastKey,
    value: target[lastKey],
    keyPath
  })
}

// ============================================================
// core style hook
// ============================================================

export function useTransformStyle (styleObj: Record<string, any> = {}, { enableVar, transformRadiusPercent, parentFontSize, parentWidth, parentHeight }: TransformStyleConfig) {
  const varStyle: Record<string, any> = {}
  const unoVarStyle: Record<string, any> = {}
  const normalStyle: Record<string, any> = {}
  let hasVarDec = false
  let hasVarUse = false
  let hasSelfPercent = false
  let hasBoxSizingAffectingStyle = false
  const varKeyPaths: Array<Array<string>> = []
  const unoVarKeyPaths: Array<Array<string>> = []
  const percentKeyPaths: Array<Array<string>> = []
  const calcKeyPaths: Array<Array<string>> = []
  const envKeyPaths: Array<Array<string>> = []
  const shorthandKeys: string[] = []
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const navigation = useNavigation()

  function varVisitor ({ target, key, value, keyPath }: VisitorArg) {
    if (keyPath.length === 1) {
      if (unoVarDecRegExp.test(key)) {
        unoVarStyle[key] = value
      } else if (varDecRegExp.test(key)) {
        hasVarDec = true
        varStyle[key] = value
      } else {
        // clone对象避免set值时改写到props
        normalStyle[key] = isObject(value) ? diffAndCloneA(value).clone : value
      }
    }
    // 对于var定义中使用的var无需替换值，可以通过resolveVar递归解析出值
    if (!varDecRegExp.test(key)) {
      // 一般情况下一个样式属性中不会混用unocss var和普通css var，可分开进行互斥处理
      if (unoVarUseRegExp.test(value)) {
        unoVarKeyPaths.push(keyPath.slice())
      } else if (varUseRegExp.test(value)) {
        hasVarUse = true
        varKeyPaths.push(keyPath.slice())
      } else {
        visitOther({ target, key, value, keyPath })
      }
    }
  }

  function boxSizingVisitor ({ key, keyPath }: VisitorArg) {
    if (keyPath.length === 1 && !hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  }

  function envVisitor ({ value, keyPath }: VisitorArg) {
    if (envUseRegExp.test(value)) {
      envKeyPaths.push(keyPath.slice())
    }
  }

  function calcVisitor ({ value, keyPath }: VisitorArg) {
    if (calcUseRegExp.test(value)) {
      calcKeyPaths.push(keyPath.slice())
    }
  }

  function percentVisitor ({ key, value, keyPath }: VisitorArg) {
    // fixme 去掉 translate & border-radius 的百分比计算
    // fixme Image 组件 borderRadius 仅支持 number
    if (transformRadiusPercent && hasOwn(radiusPercentRule, key) && percentRegExp.test(value)) {
      hasSelfPercent = true
      percentKeyPaths.push(keyPath.slice())
    } else if ((key === 'fontSize' || key === 'lineHeight') && percentRegExp.test(value)) {
      percentKeyPaths.push(keyPath.slice())
    }
  }

  function shorthandVisitor ({ key, keyPath }: VisitorArg) {
    if (keyPath.length === 1 && hasOwn(runtimeAbbreviationMap, key)) {
      shorthandKeys.push(key)
    }
  }

  function visitOther ({ target, key, value, keyPath }: VisitorArg) {
    if (typeof value === 'string' && (value.includes('%') || value.includes('calc(') || value.includes('env('))) {
      [envVisitor, percentVisitor, calcVisitor].forEach(visitor => visitor({ target, key, value, keyPath }))
    }
  }

  // traverse var & generate normalStyle
  traverseStyle(styleObj, [varVisitor, boxSizingVisitor, shorthandVisitor])
  enableVar = enableVar || hasVarDec || hasVarUse
  const enableVarRef = useRef(enableVar)
  if (enableVarRef.current !== enableVar) {
    error('css variable use/declare should be stable in the component lifecycle, or you can set [enable-var] with true.')
  }
  // apply css var
  const varContextRef = useRef({})
  if (enableVarRef.current) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const varContext = useContext(VarContext)
    const newVarContext = extendObject({}, varContext, varStyle)
    // 缓存比较newVarContext是否发生变化
    if (diffAndCloneA(varContextRef.current, newVarContext).diff) {
      varContextRef.current = newVarContext
    }
    transformVar(normalStyle, varKeyPaths, varContextRef.current, visitOther)
  }

  // apply unocss var
  if (unoVarKeyPaths.length) {
    transformVar(normalStyle, unoVarKeyPaths, unoVarStyle, visitOther)
  }

  const percentConfig = {
    width,
    height,
    fontSize: normalStyle.fontSize,
    parentWidth,
    parentHeight,
    parentFontSize
  }

  const positionMeta = {
    hasPositionFixed: false
  }

  // apply env
  transformEnv(normalStyle, envKeyPaths, navigation)
  // apply percent
  transformPercent(normalStyle, percentKeyPaths, percentConfig)
  // apply calc
  transformCalc(normalStyle, calcKeyPaths, (value: string, key: string) => {
    if (percentRegExp.test(value)) {
      if (hasOwn(selfPercentRule, key)) {
        hasSelfPercent = true
      }
      const resolved = resolvePercent(value, key, percentConfig)
      return typeof resolved === 'number' ? resolved : 0
    } else {
      const formatted = global.__formatValue(value)
      if (typeof formatted === 'number') {
        return formatted
      } else {
        warn('calc() only support number, px, rpx, % temporarily.')
        return 0
      }
    }
  })

  // apply position
  transformPosition(normalStyle, positionMeta)
  // transform number enum stringify
  transformStringify(normalStyle)
  // transform unit
  transformBoxShadow(normalStyle)
  // transform 字符串格式转化数组格式
  transformTransform(normalStyle)
  transformBoxSizing(normalStyle, hasBoxSizingAffectingStyle)
  // apply runtime style processing alignment
  transformFontFamily(normalStyle)
  transformFlex(normalStyle)
  transformShorthand(normalStyle, shorthandKeys)
  transformBackground(normalStyle)

  return {
    hasVarDec,
    varContextRef,
    setWidth,
    setHeight,
    normalStyle,
    hasSelfPercent,
    hasPositionFixed: positionMeta.hasPositionFixed
  }
}

// ============================================================
// other React hooks
// ============================================================

export function useNavigation (): Record<string, any> | undefined {
  const { navigation } = useContext(RouteContext) || {}
  return navigation
}

/**
 * 用法等同于 useEffect，但是会忽略首次执行，只在依赖更新时执行
 */
export const useUpdateEffect = (effect: any, deps: any) => {
  const isMounted = useRef(false)

  // for react-refresh
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
    } else {
      return effect()
    }
  }, deps)
}

export const useLayout = ({ props, hasSelfPercent, setWidth, setHeight, onLayout, nodeRef }: LayoutConfig) => {
  const layoutRef = useRef({})
  const hasLayoutRef = useRef(false)
  const layoutStyle = useMemo(() => { return !hasLayoutRef.current && hasSelfPercent ? hiddenStyle : {} }, [hasLayoutRef.current])
  const layoutProps: Record<string, any> = {}
  const navigation = useNavigation()
  const enableOffset = props['enable-offset']
  if (hasSelfPercent || onLayout || enableOffset) {
    layoutProps.onLayout = (e: LayoutChangeEvent) => {
      hasLayoutRef.current = true
      if (hasSelfPercent) {
        const { width, height } = e?.nativeEvent?.layout || {}
        setWidth && setWidth(width || 0)
        setHeight && setHeight(height || 0)
      }
      if (enableOffset) {
        nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
          const { top: navigationY = 0 } = navigation?.layout || {}
          layoutRef.current = { x, y: y - navigationY, width, height, offsetLeft, offsetTop: offsetTop - navigationY }
        })
      }
      onLayout && onLayout(e)
      props.onLayout && props.onLayout(e)
    }
  }
  return {
    layoutRef,
    layoutStyle,
    layoutProps
  }
}

export function useTextPassThrough (
  textStyle?: TextStyle,
  textProps?: Record<string, any>,
  { enableTextPassThrough = false }: TextPassThroughValueOptions = {}
) {
  const shouldEnableTextPassThrough = (
    enableTextPassThrough ||
    !!textStyle ||
    !!textProps
  )
  const enableTextPassThroughRef = useRef(shouldEnableTextPassThrough)

  if (enableTextPassThroughRef.current !== shouldEnableTextPassThrough) {
    error('[Mpx runtime error]: text style/props use should be stable in the component lifecycle, or you can set [enable-text-pass-through] with true.')
  }

  if (!enableTextPassThroughRef.current) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const parent = useContext(TextPassThroughContext)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const valueRef = useRef<TextPassThroughContextValue | null>(null)

  const nextTextStyle = textStyle
    ? extendObject({}, parent?.textStyle, textStyle)
    : parent?.textStyle
  const nextTextProps = textProps
    ? extendObject({}, parent?.pendingTextProps, textProps)
    : parent?.pendingTextProps
  const nextValue = {
    textStyle: nextTextStyle,
    pendingTextProps: nextTextProps
  }

  if (diffAndCloneA(valueRef.current, nextValue).diff) {
    valueRef.current = nextValue
  }

  return valueRef.current
}

export function useTextPassThroughText (textStyle?: TextStyle) {
  const inheritedText = useContext(TextPassThroughContext)
  const valueRef = useRef<TextPassThroughContextValue | null>(null)

  if (!textStyle) {
    return {
      inheritedText,
      textPassThrough: null
    }
  }

  const nextValue = {
    textStyle: extendObject({}, inheritedText?.textStyle, textStyle)
  }

  if (diffAndCloneA(valueRef.current, nextValue).diff) {
    valueRef.current = nextValue
  }

  return {
    inheritedText,
    textPassThrough: valueRef.current
  }
}

export function useHover ({ enableHover, hoverStartTime, hoverStayTime, disabled }: { enableHover: boolean, hoverStartTime: number, hoverStayTime: number, disabled?: boolean }) {
  const enableHoverRef = useRef(enableHover)
  if (enableHoverRef.current !== enableHover) {
    error('[Mpx runtime error]: hover-class use should be stable in the component lifecycle.')
  }

  if (!enableHoverRef.current) return { isHover: false }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const gestureRef = useContext(ScrollViewContext).gestureRef
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isHover, setIsHover] = useState(false)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const dataRef = useRef<{
    startTimer?: ReturnType<typeof setTimeout>
    stayTimer?: ReturnType<typeof setTimeout>
  }>({})

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    return () => {
      dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
      dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer)
    }
  }, [])

  const setStartTimer = () => {
    if (disabled) return
    dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
    dataRef.current.startTimer = setTimeout(() => {
      setIsHover(true)
    }, +hoverStartTime)
  }

  const setStayTimer = () => {
    if (disabled) return
    dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer)
    dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
    dataRef.current.stayTimer = setTimeout(() => {
      setIsHover(false)
    }, +hoverStayTime)
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const gesture = useMemo(() => {
    return Gesture.Pan()
      .onTouchesDown(() => {
        setStartTimer()
      })
      .onTouchesUp(() => {
        setStayTimer()
      }).runOnJS(true)
  }, [])

  if (gestureRef) {
    gesture.simultaneousWithExternalGesture(gestureRef)
  }

  return {
    isHover,
    gesture
  }
}

export function useRunOnJSCallback (callbackMapRef: MutableRefObject<Record<string, AnyFunc>>) {
  const invokeCallback = useCallback((key: string, ...args: any) => {
    const callback = callbackMapRef.current[key]
    // eslint-disable-next-line node/no-callback-literal
    if (isFunction(callback)) return callback(...args)
  }, [])

  useEffect(() => {
    return () => {
      callbackMapRef.current = {}
    }
  }, [])

  return invokeCallback
}

export const useDebounceCallback = <T extends AnyFunc> (
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { clear: () => void } => {
  const debounced = useMemo(() => debounce(func, delay), [func])
  return debounced
}

export const useStableCallback = <T extends AnyFunc | null | undefined> (
  callback: T
): T extends AnyFunc ? T : () => void => {
  const ref = useRef<T>(callback)
  ref.current = callback
  return useCallback<any>(
    (...args: any[]) => ref.current?.(...args),
    []
  )
}

export function usePrevious<T> (value: T): T | undefined {
  const ref = useRef<T | undefined>()
  const prev = ref.current
  ref.current = value
  return prev
}

// ============================================================
// component helpers
// ============================================================

export function wrapChildren (props: Record<string, any> = {}, { hasVarDec, varContext, textPassThrough }: WrapChildrenConfig) {
  let { children } = props
  if (textPassThrough) {
    children = <TextPassThroughContext.Provider value={textPassThrough} key='textPassThroughWrap'>{children}</TextPassThroughContext.Provider>
  }
  if (hasVarDec && varContext) {
    children = <VarContext.Provider value={varContext} key='varContextWrap'>{children}</VarContext.Provider>
  }
  return children
}

export function renderImage (
  imageProps: ImageProps,
  enableFastImage = true
) {
  let Component = Image
  if (enableFastImage) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fastImageModule = require('@d11/react-native-fast-image')
    Component = fastImageModule.default || fastImageModule
  }
  return createElement(Component, imageProps)
}

export function flatGesture (gestures: Array<GestureHandler> = []) {
  return (gestures && gestures.flatMap((gesture: GestureHandler) => {
    if (gesture && gesture.nodeRefs) {
      return gesture.nodeRefs
        .map((item: { getNodeInstance: () => any }) => item.getNodeInstance()?.instance?.gestureRef || {})
    }
    return gesture?.current ? [gesture] : []
  })) || []
}

export function getCurrentPage (pageId: number | null | undefined) {
  if (!global.getCurrentPages) return
  const pages = global.getCurrentPages()
  return pages.find((page: any) => isFunction(page.getPageId) && page.getPageId() === pageId)
}
