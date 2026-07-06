import { useEffect, useCallback, useMemo, useRef, ReactNode, ReactElement, isValidElement, useContext, useState, Dispatch, SetStateAction, createElement, MutableRefObject } from 'react'
import { LayoutChangeEvent, TextStyle, ImageProps, Image } from 'react-native'
import { isObject, isFunction, isNumber, hasOwn, diffAndCloneA, shallowEqual, error, warn } from '@mpxjs/utils'
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
const lengthValueRegExp = /^(-?(?:\d+(?:\.\d+)?|\.\d+)(?:rpx|px|%|vw|vh)?|hairlineWidth)$/
const DEFAULT_FONT_SIZE = 16
// transform: 'rotateX(45deg) ...' 单段拆出 fn 名与括号内值
const transformFnRegExp = /([/\w]+)\((.+)\)/
// boxShadow 子值识别 rpx 单位（仅 rpx 需要换算为 px，其它单位保留原样）
const rpxSuffixRegExp = /\d+rpx$/
// font-family / font 简写解析时统一去掉单/双引号
const quoteCharRegExp = /["']/g
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
  // RN 不支持单边 border-*-style，统一展开到 borderStyle
  // 实测 RN 上当 borderStyle 不为 solid 时单边 border-*-color 不生效，
  // 这里把单边 color 也统一展开到 borderColor 规避（width 不能这样做，否则会覆盖其它三边）
  borderTop: ['borderTopWidth', 'borderStyle', 'borderColor'],
  borderRight: ['borderRightWidth', 'borderStyle', 'borderColor'],
  borderBottom: ['borderBottomWidth', 'borderStyle', 'borderColor'],
  borderLeft: ['borderLeftWidth', 'borderStyle', 'borderColor'],
  flexFlow: ['flexDirection', 'flexWrap'],
  textShadow: ['textShadowOffset.width', 'textShadowOffset.height', 'textShadowRadius', 'textShadowColor'],
  textDecoration: ['textDecorationLine', 'textDecorationStyle', 'textDecorationColor'],
  // gap：CSS 2 槽位（row-gap / column-gap），单值复制行列。RN 原生支持但要求 number。
  // 单值串在 __getStyle 的 transformStyleObj / 编译期 formatValue 已被 __formatValue 换算为 number；
  // 真正以字符串形态进 transformShorthand 的是多值串（如 '10px 20px'）—— unitRegExp 不命中、原样透传。
  // 因此进入 runtimeForceExpandCompositeMap，避免「单值透传」捷径放过这类多值串残留。
  // 百分比（`gap: 50%` / `gap: 10px 50%`）由 transformShorthand 写回阶段就地 resolvePercent 落成 number
  gap: ['rowGap', 'columnGap'],
  // inset：4 槽位等价 margin 四值语法；RN 0.74+ 原生支持单值 DimensionValue，单值走 runtimeCompositeStyleMap 短路透传
  inset: ['top', 'right', 'bottom', 'left'],
  // outline: <outline-width> || <outline-style> || <outline-color>，顺序不敏感
  outline: ['outlineWidth', 'outlineStyle', 'outlineColor']
}
const runtimeCompositeStyleMap: Record<string, boolean> = {
  margin: true,
  padding: true,
  borderRadius: true,
  borderWidth: true,
  borderColor: true,
  gap: true,
  inset: true
}
const runtimeUnorderedAbbreviationMap: Record<string, boolean> = {
  border: true,
  borderTop: true,
  borderRight: true,
  borderBottom: true,
  borderLeft: true,
  flexFlow: true,
  textShadow: true,
  textDecoration: true,
  // outline 与 border 简写共享同一套缺省值处理
  outline: true
}
// 单值简写在 __getStyle 阶段经 __formatValue 把带单位长度换算为 number 后，
// 需要在 transformShorthand 入口转回字符串 token 交给展开逻辑的 key 集合。
// margin / padding / borderRadius / borderWidth / borderColor / inset 不在此列：
// RN 原生支持这些 key 直接吃单值 number，无需展开。
const runtimeNumericExpandShorthandMap: Record<string, boolean> = {
  border: true,
  borderTop: true,
  borderRight: true,
  borderBottom: true,
  borderLeft: true,
  outline: true,
  gap: true
}
// CSS border-width: medium 的实测值（各主流浏览器一致取 3px）
// 与编译期 wx/index.js 同名常量保持一致；调整需两侧一起改
const BORDER_MEDIUM_WIDTH = 3
// 运行时简写槽位缺省值表（与编译期 ShorthandDefaultMap 镜像，仅 CSS quote 形式不同）
// 值即槽位缺省时追加的补齐值；borderColor / textShadowRadius 因 RN 有内置缺省值不补，不进此表
// none 清除语义统一保留到 useTransformStyle 末尾处理
const runtimeShorthandDefaultMap: Record<string, Record<string, any>> = {
  border: { borderWidth: BORDER_MEDIUM_WIDTH, borderStyle: 'none' },
  borderTop: { borderTopWidth: BORDER_MEDIUM_WIDTH, borderStyle: 'none' },
  borderRight: { borderRightWidth: BORDER_MEDIUM_WIDTH, borderStyle: 'none' },
  borderBottom: { borderBottomWidth: BORDER_MEDIUM_WIDTH, borderStyle: 'none' },
  borderLeft: { borderLeftWidth: BORDER_MEDIUM_WIDTH, borderStyle: 'none' },
  // outline 与 border 缺省值完全对齐：缺 width → BORDER_MEDIUM_WIDTH；
  // 缺 style → outlineStyle: none，末尾统一转换为 outlineWidth: 0
  outline: { outlineWidth: BORDER_MEDIUM_WIDTH, outlineStyle: 'none' },
  textShadow: { textShadowColor: '#000' }
  // textDecoration / flexFlow 暂不配置，与 RN 默认一致
}

const borderStyleMap: Record<string, boolean> = {
  // RN 实测仅支持 solid/dotted/dashed；none 作为 CSS 合法值保留到末尾统一转换为 borderWidth: 0
  solid: true,
  dotted: true,
  dashed: true,
  none: true
}
const textDecorationLineMap: Record<string, boolean> = {
  none: true,
  underline: true,
  'line-through': true
}
const textDecorationStyleMap: Record<string, boolean> = {
  solid: true,
  double: true,
  dotted: true,
  dashed: true
}
// font 简写 <font-weight> 槽位允许的关键字 / 数值（CSS 子集，与 RN 支持一致）
const fontWeightMap: Record<string, boolean> = {
  bold: true,
  normal: true,
  100: true,
  200: true,
  300: true,
  400: true,
  500: true,
  600: true,
  700: true,
  800: true,
  900: true
}
const flexDirectionMap: Record<string, boolean> = {
  row: true,
  'row-reverse': true,
  column: true,
  'column-reverse': true
}
const flexWrapMap: Record<string, boolean> = {
  wrap: true,
  nowrap: true,
  'wrap-reverse': true
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
  bottom: true,
  // row-gap 百分比按 CSS 规范基于容器内容区高度；columnGap 不入此表，落默认 parentWidth 分支
  rowGap: true
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
  parentWidth?: number
  parentHeight?: number
}

interface TransformStyleConfig {
  enableVar?: boolean
  parentWidth?: number
  parentHeight?: number
  transformRadiusPercent?: boolean
  defaultStyle?: Record<string, any>
}

export interface VisitorArg {
  target: Record<string, any>
  key: string
  value: any
  keyPath: Array<string>
}

interface LayoutConfig {
  props: Record<string, any>
  hasSelfPercent: boolean
  setWidth?: Dispatch<SetStateAction<number>>
  setHeight?: Dispatch<SetStateAction<number>>
  onLayout?: (event: LayoutChangeEvent) => void
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

function isLengthValue (token: string): boolean {
  return lengthValueRegExp.test(token)
}

export function isBoxSizingAffectingStyle (key: string) {
  return hasOwn(boxSizingAffectingStyleMap, key)
}

// 仅在调用侧已确认存在 padding / border 等 box-sizing 影响项时调用：
// 给样式补默认 boxSizing（用户未显式设置时）。是否需要进入由调用侧决定，
// useTransformStyle / mpx-simple-view / mpx-simple-text 都按 hasBoxSizingAffectingStyle 短路。
export function transformBoxSizing (style: Record<string, any> = {}) {
  if (style.boxSizing === undefined) {
    style.boxSizing = global.__mpx?.config?.rnConfig?.defaultBoxSizing ?? defaultBoxSizingStyle.boxSizing
  }
}

export function splitStyle<T extends Record<string, any>> (styleObj: T, sideEffect?: (key: string, val: T[keyof T]) => void): {
  textStyle?: Partial<T>
  backgroundStyle?: Partial<T>
  innerStyle?: Partial<T>
} {
  const keys = Object.keys(styleObj)
  let textStyle: Partial<T> | undefined
  let backgroundStyle: Partial<T> | undefined
  let innerStyle: Partial<T> | undefined
  let firstSpecialIdx = -1

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const val = styleObj[key]
    sideEffect && sideEffect(key, val)

    if (isTextStyle(key)) {
      if (firstSpecialIdx < 0) firstSpecialIdx = i
      textStyle = textStyle || {}
      textStyle[key as keyof T] = val
    } else if (hasOwn(backgroundStyleMap, key)) {
      if (firstSpecialIdx < 0) firstSpecialIdx = i
      backgroundStyle = backgroundStyle || {}
      backgroundStyle[key as keyof T] = val
    } else if (firstSpecialIdx >= 0) {
      innerStyle = innerStyle || {}
      innerStyle[key as keyof T] = val
    }
  }

  if (firstSpecialIdx < 0) return { innerStyle: styleObj }

  if (firstSpecialIdx > 0) {
    innerStyle = innerStyle || {}
    for (let i = 0; i < firstSpecialIdx; i++) {
      const key = keys[i]
      innerStyle[key as keyof T] = styleObj[key]
    }
  }
  return { textStyle, backgroundStyle, innerStyle }
}

export function splitProps<T extends Record<string, any>> (props: T): {
  textProps?: Partial<T>
  innerProps?: Partial<T>
} {
  const keys = Object.keys(props)
  let textProps: Partial<T> | undefined
  let innerProps: Partial<T> | undefined
  let firstTextIdx = -1

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (hasOwn(textPropsMap, key)) {
      if (firstTextIdx < 0) firstTextIdx = i
      textProps = textProps || {}
      textProps[key as keyof T] = props[key]
    } else if (firstTextIdx >= 0) {
      innerProps = innerProps || {}
      innerProps[key as keyof T] = props[key]
    }
  }

  if (firstTextIdx < 0) return { innerProps: props }

  if (firstTextIdx > 0) {
    innerProps = innerProps || {}
    for (let i = 0; i < firstTextIdx; i++) {
      const key = keys[i]
      innerProps[key as keyof T] = props[key]
    }
  }
  return { textProps, innerProps }
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
  const insets = extendObject({}, initialWindowMetrics?.insets, navigation?.insets)
  envKeyPaths.forEach((envKeyPath) => {
    setStyle(styleObj, envKeyPath, ({ target, key, value }) => {
      const parsed = parseFunc(value, 'env')
      const replaced = new ReplaceSource(value)
      parsed.forEach(({ start, end, args }) => {
        const name = args[0]
        const fallback = args[1] || ''
        const inset = insets[safeAreaInsetMap[name]]
        const next = '' + (inset ?? global.__formatValue(fallback))
        replaced.replace(start, end - 1, next)
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
    base = DEFAULT_FONT_SIZE
    reason = 'default-font-size'
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
  // 与编译期 wx/index.js 同 transform formatter 口径对齐：
  // 「整条 transform 声明」绝不会因单个子项失败而丢弃，被丢的只有那一个子项，其余 transform 项仍输出。
  // 因此本 forEach 内所有「丢这一项」的提示一律用 warn（编译期同名分支注释：「仅丢这一 transform 项，其它项仍输出，按规范使用 warn」）。
  values.forEach(item => {
    const match = item.match(transformFnRegExp)
    if (!match || match.length < 3) {
      warn(`Transform value [${item}] is not a valid fn(value) form, dropped.`)
      return
    }
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
        // parseValues 内部已 trim
        const matrixValues = parseValues(val, ',').map(v => +v)
        if (matrixValues.length === 6) {
          const [a, b, c, d, tx, ty] = matrixValues
          transform.push({ matrix: [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1] })
        } else {
          warn(`Transform matrix only supports 6 values in React Native, got ${matrixValues.length}`)
        }
        break
      }
      case 'matrix3d': {
        // parseValues 内部已 trim
        const matrixValues = parseValues(val, ',').map(v => +v)
        if (matrixValues.length === 16) {
          transform.push({ matrix: matrixValues })
        } else {
          warn(`Transform matrix only supports 16 values in React Native, got ${matrixValues.length}`)
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
        vals.forEach((v, index) => {
          if (key !== 'rotate' && index > 1) {
            warn(`Transform [${key}Z] is not supported in React Native, dropped.`)
            return
          }
          // parseValues 内部已 trim
          transform.push({ [`${key}${xyz[index] || ''}`]: global.__formatValue(v) })
        })
        break
      }
      case 'rotate3d': {
        const parts = parseValues(val, ',')
        if (parts.length !== 4) {
          warn(`Transform rotate3d only supports 4 values, got ${parts.length}`)
          break
        }
        // parseValues 内部已 trim
        const x = +parts[0]
        const y = +parts[1]
        const z = +parts[2]
        const angle = parts[3]
        if (x && !y && !z) transform.push({ rotateX: angle })
        else if (!x && y && !z) transform.push({ rotateY: angle })
        else if (!x && !y && z) transform.push({ rotateZ: angle })
        else warn(`Transform rotate3d(${val}) only supports single-axis vector (1,0,0) / (0,1,0) / (0,0,1) in React Native, dropped.`)
        break
      }
      case 'translateZ':
      case 'scaleZ':
        // RN 不支持 Z 轴 translate/scale，丢该子项；编译期同分支用 warn（unsupportedPropError isError=false）
        warn(`Transform [${key}] is not supported in React Native, dropped.`)
        break
      default:
        warn(`Transform fn [${key}] is not supported in React Native, dropped.`)
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
    if (rpxSuffixRegExp.test(i)) {
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
  for (let i = 0; i < props.length && i < values.length; i++) {
    pushExpandedPair(result, props[i], global.__formatValue(values[i]))
  }
  return result
}

function pushExpandedPair (result: Array<[string, any]>, prop: string, value: any) {
  if (prop.includes('.')) {
    const [main, sub] = prop.split('.')
    let entry = result.find(item => item[0] === main)
    if (!entry) {
      entry = [main, {}]
      result.push(entry)
    }
    entry[1][sub] = value
  } else {
    result.push([prop, value])
  }
}

function getUnorderedShorthandProp (key: string, token: string, used: Record<string, boolean>): string | undefined {
  const props = runtimeAbbreviationMap[key]
  for (const prop of props) {
    if (used[prop]) continue
    if (matchRuntimeShorthandProp(prop, token)) return prop
  }
}

function matchRuntimeShorthandProp (prop: string, token: string): boolean {
  if (prop === 'textShadowOffset.width' || prop === 'textShadowOffset.height' || prop === 'textShadowRadius') return isLengthValue(token)
  if (prop === 'textShadowColor') return isColorValue(token)
  if (prop.endsWith('Width')) return isLengthValue(token)
  if (prop === 'textDecorationStyle') return hasOwn(textDecorationStyleMap, token)
  if (prop.endsWith('Style')) return hasOwn(borderStyleMap, token)
  if (prop.endsWith('Color')) return isColorValue(token)
  if (prop === 'flexDirection') return hasOwn(flexDirectionMap, token)
  if (prop === 'flexWrap') return hasOwn(flexWrapMap, token)
  return false
}

// 通用补齐：扫描完所有 token 后，将 runtimeShorthandDefaultMap 中未被占用（不在 used）的槽位追加到 pairs
// used 即主循环的占用记录，key 是完整目标 prop 名（含 textShadowOffset.width 这类 dot 路径）
function applyRuntimeShorthandDefaults (key: string, pairs: Array<[string, any]>, used: Record<string, boolean>): Array<[string, any]> {
  const defaults = runtimeShorthandDefaultMap[key]
  if (!defaults) return pairs
  for (const target in defaults) {
    if (!used[target]) {
      pushExpandedPair(pairs, target, defaults[target])
    }
  }
  return pairs
}

function expandUnorderedAbbreviation (key: string, values: string[]): Array<[string, any]> {
  const result: Array<[string, any]> = []
  const used: Record<string, boolean> = {}
  let hasTextDecorationNone = false
  let hasUnderline = false
  let hasLineThrough = false
  for (const value of values) {
    if (key === 'textDecoration' && hasOwn(textDecorationLineMap, value)) {
      switch (value) {
        case 'underline':
          hasUnderline = true
          continue
        case 'line-through':
          hasLineThrough = true
          continue
        case 'none':
          hasTextDecorationNone = true
          continue
        // textDecorationLineMap 命中但分支未处理的 line token：落到通用 getUnorderedShorthandProp 流程
      }
    }
    const prop = getUnorderedShorthandProp(key, value, used)
    if (!prop) {
      // 该 token 与 key 下任何空闲槽位都不匹配（未知类型 / 槽位已占满），静默丢弃可能让用户难以察觉
      warn(`Token [${value}] in [${key}: ${values.join(' ')}] is not a valid value or has no available slot, dropped.`)
      continue
    }
    used[prop] = true
    pushExpandedPair(result, prop, global.__formatValue(value))
  }
  if (hasUnderline || hasLineThrough) {
    result.push(['textDecorationLine', hasUnderline && hasLineThrough ? 'underline line-through' : hasUnderline ? 'underline' : 'line-through'])
  } else if (hasTextDecorationNone) {
    result.push(['textDecorationLine', 'none'])
  }
  // text-shadow 至少需要 offset-x / offset-y；缺省 height 时按 CSS 默认补 0 并发出 warn
  if (key === 'textShadow') {
    const offsetEntry = result.find(item => item[0] === 'textShadowOffset')?.[1]
    if (offsetEntry && offsetEntry.width !== undefined && offsetEntry.height === undefined) {
      warn(`Value of [textShadow:${values.join(' ')}] is missing offset-y, fallback to 0, please check again!`)
      offsetEntry.height = 0
    }
  }
  return applyRuntimeShorthandDefaults(key, result, used)
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

// font 简写专用 transform，仿 transformFlex 的标志位模式。
// RN 等效子集语法：font: [ <font-style> ] [ <font-variant-css2> ] [ <font-weight> ] <font-size> [ / <line-height> ] <font-family>
// - 必填项：font-size 与 font-family；缺其一整条 font 声明丢弃（error）
// - 非必填 token（font-stretch / 数字型 font-variant-numeric / system 关键字等）：warn 提示并忽略，保留其余槽位
function transformFont (styleObj: Record<string, any>) {
  const value = styleObj.font
  if (typeof value !== 'string') return
  const tokens = parseValues(value)
  let sizeIdx = -1
  let lineHeight: string | undefined
  const result: Array<[string, any]> = []
  // 1. 定位 font-size（第一个 length，可能带 /<line-height>）
  //    注意：unit-less 数字也命中 length 正则，需要先排除 font-weight 数字（100..900 / bold / normal），
  //    否则 `font: 500 16px Arial` 会把 500 误判为 fontSize。
  //    fontSize 自身可能是 %（如 `font: 50% Arial`），保留给文本透传阶段按继承 fontSize 解析；
  //    fontSize % 校验通过的是 `isLengthValue`（length 正则含 %），主流程已用 length 分支接住，无需特判
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i]
    if (t.endsWith('/') && tokens[i + 1]) {
      t += tokens[i + 1]
      tokens.splice(i + 1, 1)
    } else if (tokens[i + 1] === '/' && tokens[i + 2]) {
      t += `/${tokens[i + 2]}`
      tokens.splice(i + 1, 2)
    } else if (tokens[i + 1]?.startsWith('/') && tokens[i + 1].length > 1) {
      t += tokens[i + 1]
      tokens.splice(i + 1, 1)
    }
    const [sizePart, lhPart] = parseValues(t, '/')
    if (hasOwn(fontWeightMap, sizePart)) continue
    if (isLengthValue(sizePart)) {
      sizeIdx = i
      result.push(['fontSize', global.__formatValue(sizePart)])
      if (lhPart) lineHeight = lhPart
      break
    }
  }
  if (sizeIdx === -1) {
    // 缺必填 font-size 整体丢弃；与 transformFlex「Flex shorthand value [...] ..., dropped.」同口径
    error(`Font shorthand value [${value}] is missing required <font-size>, dropped.`)
    delete styleObj.font
    return
  }
  // 2. 前导段 font-style / font-variant(small-caps) / font-weight，顺序不敏感
  for (let i = 0; i < sizeIdx; i++) {
    const t = tokens[i]
    if (t === 'normal') continue
    if (t === 'italic') {
      result.push(['fontStyle', t])
    } else if (t === 'small-caps') {
      // RN processFontVariant 接受字符串，内部 split 归一为数组，与 font-variant 长属性同口径
      result.push(['fontVariant', t])
    } else if (hasOwn(fontWeightMap, t)) {
      result.push(['fontWeight', t])
    } else {
      // 其余（font-stretch / 数字型 font-variant-numeric / system 关键字等）→ 非必填：
      // 与 transformBackground「Token [...] in [background: ...] ..., dropped.」同口径，warn + 忽略该 token、保留其余
      warn(`Token [${t}] in [font: ${value}] is not supported (only font-style / small-caps / font-weight are valid before <font-size>), dropped.`)
    }
  }
  // 3. line-height：文本透传阶段会基于当前 / 继承 fontSize 解析百分比。
  //    - unit-less 数字（1.5）→ '150%' 中间态，避免和已格式化 RN 绝对 number 混淆
  //    - 其它值（120% / 40px / 40rpx）→ __formatValue
  if (lineHeight !== undefined) {
    const lh = !isNaN(+lineHeight)
      ? `${+lineHeight * 100}%`
      : global.__formatValue(lineHeight)
    if (lh !== undefined) {
      result.push(['lineHeight', lh])
    } else {
      warn(`Line-height [${lineHeight}] in [font: ${value}] could not be resolved, dropped.`)
    }
  }
  // 4. font-family（font-size 之后剩余部分；多字体取首值、去引号）
  const familyStr = tokens.slice(sizeIdx + 1).join(' ').trim()
  if (!familyStr) {
    error(`Font shorthand value [${value}] is missing required <font-family>, dropped.`)
    delete styleObj.font
    return
  }
  // parseValues 内部已 trim
  const family = parseValues(familyStr.replace(quoteCharRegExp, ''), ',')[0]
  if (family) result.push(['fontFamily', family])
  delete styleObj.font
  for (const [prop, val] of result) {
    if (!hasOwn(styleObj, prop)) styleObj[prop] = val
  }
}

function transformFlex (styleObj: Record<string, any>) {
  const value = styleObj.flex
  if (typeof value !== 'string') return
  delete styleObj.flex
  const flexResult = expandFlex(value)
  if (!flexResult) {
    // expandFlex 仅在 parseValues 出空数组时返回 null（空字符串 / 纯空白），属于明确非法，整段丢弃
    error(`Flex shorthand value [${value}] is not a valid CSS flex value, dropped.`)
    return
  }
  for (const [prop, val] of flexResult) {
    if (!hasOwn(styleObj, prop)) styleObj[prop] = val
  }
}

export function transformShorthand (styleObj: Record<string, any>, shorthandKeys: string[], percentConfig: PercentConfig) {
  for (const key of shorthandKeys) {
    const value = styleObj[key]

    // —— 以下为公共链路（与 textDecoration / flexFlow / textShadow / 四值简写共用）——
    let values: string[]
    if (typeof value === 'string') {
      values = parseValues(value)
    } else if (typeof value === 'number' && hasOwn(runtimeNumericExpandShorthandMap, key)) {
      // runtimeNumericExpandShorthandMap 中的简写（border / outline / gap）在 __getStyle 的 transformStyleObj
      // 阶段已被 __formatValue 把带单位长度换算为 number；这里转回字符串 token 交给后续展开，
      // 否则会原样残留为 RN 不认识或行为不一致的简写 key。
      values = ['' + value]
    } else {
      continue
    }
    const props = runtimeAbbreviationMap[key]
    if (!props) continue
    // 单值短路：composite 且单值通常透传（RN 原生支持 margin / padding / inset / border-* 单值 DimensionValue）；
    // 但 gap 必须展开 —— RN gap / rowGap / columnGap 严格要求 number，单值串虽已在 __getStyle 阶段被 __formatValue 换算，
    // 多值串（如 '10px 20px'）仍会原样透传到这里，需展开后逐 token 再过 __formatValue 才能落成 number；
    // `%` 在写回阶段由 transformShorthand 调 resolvePercent 落成 number（rowGap 基 parentHeight、columnGap 基 parentWidth）
    if (
      hasOwn(runtimeCompositeStyleMap, key) &&
      values.length === 1 &&
      key !== 'gap'
    ) continue
    let expandedValues = values
    let pairs: Array<[string, any]>
    if (hasOwn(runtimeCompositeStyleMap, key)) {
      expandedValues = expandCompositeValues(values)
    }
    if (hasOwn(runtimeUnorderedAbbreviationMap, key)) {
      // expandUnorderedAbbreviation 末尾已内部调用 applyRuntimeShorthandDefaults 补齐
      pairs = expandUnorderedAbbreviation(key, values)
    } else {
      pairs = expandAbbreviation(expandedValues, props)
    }

    delete styleObj[key]
    for (const [prop, val] of pairs) {
      if (hasOwn(styleObj, prop)) continue
      // gap 简写展开后的 rowGap / columnGap 仍可能是 `%` 字符串（如 `gap: 50%` / `gap: 10px 50%`），
      // RN 类型严格要求 number，这里就地用 resolvePercent 落成数字（rowGap 基 parentHeight、columnGap 基 parentWidth）
      if ((prop === 'rowGap' || prop === 'columnGap') && typeof val === 'string' && percentRegExp.test(val)) {
        styleObj[prop] = resolvePercent(val, prop, percentConfig)
      } else {
        styleObj[prop] = val
      }
    }
  }
}

// --- runtime alignment ---

function transformFontFamily (styleObj: Record<string, any>) {
  const value = styleObj.fontFamily
  if (typeof value !== 'string') return
  const stripped = value.replace(quoteCharRegExp, '').trim()
  if (!stripped) return
  const values = parseValues(stripped, ',')
  // parseValues 内部已 trim
  styleObj.fontFamily = values[0]
}

function transformBorderStyleNone (styleObj: Record<string, any>) {
  if (styleObj.borderStyle === 'none') {
    delete styleObj.borderStyle
    delete styleObj.borderTopWidth
    delete styleObj.borderRightWidth
    delete styleObj.borderBottomWidth
    delete styleObj.borderLeftWidth
    styleObj.borderWidth = 0
  }
  if (styleObj.outlineStyle === 'none') {
    delete styleObj.outlineStyle
    styleObj.outlineWidth = 0
  }
}

function transformPosition (styleObj: Record<string, any>) {
  if (styleObj.position === 'fixed') {
    styleObj.position = 'absolute'
    return true
  }
  return false
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
      } else {
        // background-attachment / background-origin / background-clip 及拼写错误等：RN 均不支持，提示用户避免静默丢值
        warn(`Token [${token}] in [background: ${value}] is not a recognized background sub-value, dropped.`)
      }
    }
  }
  if (positionValues.length) styleObj.backgroundPosition = transOrderXY(positionValues)
  if (sizeValues.length) styleObj.backgroundSize = sizeValues
}

// ============================================================
// style traversal
// ============================================================

export function traverseStyle (styleObj: Record<string, any>, visitor: (arg: VisitorArg) => void) {
  const keyPath: Array<string> = []
  function traverse<T extends Record<string, any>> (target: T) {
    if (Array.isArray(target)) {
      for (let i = 0; i < target.length; i++) {
        const key = String(i)
        const value = target[i]
        keyPath.push(key)
        visitor({ target, key, value, keyPath })
        traverse(value)
        keyPath.pop()
      }
    } else if (isObject(target)) {
      const keys = Object.keys(target)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const value = (target as Record<string, any>)[key]
        keyPath.push(key)
        visitor({ target, key, value, keyPath })
        traverse(value)
        keyPath.pop()
      }
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

export function useTransformStyle (styleObj: Record<string, any> = {}, { enableVar, transformRadiusPercent, parentWidth, parentHeight, defaultStyle }: TransformStyleConfig) {
  const varStyle: Record<string, any> = {}
  const unoVarStyle: Record<string, any> = {}
  const normalStyle: Record<string, any> = {}
  let hasVarDec = false
  let hasVarUse = false
  let hasSelfPercent = false
  let hasBoxSizingAffectingStyle = false
  // 顶层 transform* 标志位：在 styleVisitor 阶段从原始 styleObj 收集，
  // 调用侧据此决定是否进入对应 transform 函数。
  let hasTransform = false
  let hasBoxShadow = false
  let hasFontFamily = false
  let hasFlex = false
  let hasFont = false
  let needTransformBackground = false
  let needStringify = false
  const varKeyPaths: Array<Array<string>> = []
  const unoVarKeyPaths: Array<Array<string>> = []
  const percentKeyPaths: Array<Array<string>> = []
  const calcKeyPaths: Array<Array<string>> = []
  const envKeyPaths: Array<Array<string>> = []
  const shorthandKeys: string[] = []
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const navigation = useNavigation()

  function collectTopLevelFlags (key: string, value: any) {
    switch (key) {
      case 'transform':
        hasTransform = true
        break
      case 'boxShadow':
        hasBoxShadow = true
        break
      case 'fontFamily':
        hasFontFamily = true
        break
      case 'flex':
        hasFlex = true
        break
      case 'font':
        hasFont = true
        break
      case 'background':
      case 'backgroundSize':
      case 'backgroundPosition':
        needTransformBackground = true
        break
      case 'fontWeight':
      case 'transformOrigin':
        needStringify = true
        break
    }
  }

  function visitOther ({ key, value, keyPath }: VisitorArg) {
    if (typeof value !== 'string') return
    const hasPercent = value.includes('%')
    const hasCalc = value.includes('calc(')
    const hasEnv = value.includes('env(')
    if (!(hasPercent || hasCalc || hasEnv)) return
    let resolvedKeyPath: Array<string> | undefined
    if (hasEnv) {
      resolvedKeyPath = keyPath.slice()
      envKeyPaths.push(resolvedKeyPath)
    }
    if (hasPercent) {
      // fixme 去掉 translate & border-radius 的百分比计算
      // fixme Image 组件 borderRadius 仅支持 number
      const needRadiusPercent = transformRadiusPercent && hasOwn(radiusPercentRule, key)
      // RN gap / rowGap / columnGap 不支持 %，需要运行时换算为 number 喂给 RN
      const needGapPercent = key === 'rowGap' || key === 'columnGap'
      if ((needRadiusPercent || needGapPercent) && percentRegExp.test(value)) {
        if (needRadiusPercent) hasSelfPercent = true
        resolvedKeyPath = resolvedKeyPath ?? keyPath.slice()
        percentKeyPaths.push(resolvedKeyPath)
      }
    }
    if (hasCalc) {
      resolvedKeyPath = resolvedKeyPath ?? keyPath.slice()
      calcKeyPaths.push(resolvedKeyPath)
    }
  }

  function styleVisitor ({ target, key, value, keyPath }: VisitorArg) {
    if (keyPath.length === 1) {
      if (unoVarDecRegExp.test(key)) {
        unoVarStyle[key] = value
      } else if (varDecRegExp.test(key)) {
        hasVarDec = true
        varStyle[key] = value
      } else {
        // clone对象避免set值时改写到props
        normalStyle[key] = isObject(value) ? diffAndCloneA(value).clone : value
        if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
          hasBoxSizingAffectingStyle = true
        }
        if (hasOwn(runtimeAbbreviationMap, key)) {
          shorthandKeys.push(key)
        }
        collectTopLevelFlags(key, value)
      }
    }
    // var 定义中使用的 var 无需替换值，可以通过 resolveVar 递归解析出值
    if (varDecRegExp.test(key) || typeof value !== 'string') return
    // 一般情况下一个样式属性中不会混用 unocss var 和普通 css var，可分开互斥处理
    if (unoVarUseRegExp.test(value)) {
      unoVarKeyPaths.push(keyPath.slice())
    } else if (varUseRegExp.test(value)) {
      hasVarUse = true
      varKeyPaths.push(keyPath.slice())
    } else {
      visitOther({ target, key, value, keyPath })
    }
  }

  // traverse var & generate normalStyle
  traverseStyle(styleObj, styleVisitor)
  enableVar = enableVar || hasVarDec || hasVarUse
  const enableVarRef = useRef(enableVar)
  if (enableVarRef.current !== enableVar) {
    error('css variable use/declare should be stable in the component lifecycle, or you can set [enable-var] with true.')
  }
  // apply css var
  const varContextRef = useRef<Record<string, any>>({})
  if (enableVarRef.current) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const varContext = useContext(VarContext)
    // 无声明节点：直接用父 varContext 解析，跳过 merge / 比对 / ref 维护。
    // 有声明节点：浅合并出 newVarContext，仅在内容变化时替换 ref 维持引用稳定，
    //            供 wrapChildren 的 <VarContext.Provider> 使用。
    let resolvedVarContext = varContext
    if (hasVarDec) {
      const newVarContext = extendObject({}, varContext, varStyle)
      if (!shallowEqual(varContextRef.current, newVarContext)) {
        varContextRef.current = newVarContext
      }
      resolvedVarContext = varContextRef.current
    }
    if (varKeyPaths.length) transformVar(normalStyle, varKeyPaths, resolvedVarContext, visitOther)
  }

  // apply unocss var
  if (unoVarKeyPaths.length) transformVar(normalStyle, unoVarKeyPaths, unoVarStyle, visitOther)
  // apply env
  if (envKeyPaths.length) transformEnv(normalStyle, envKeyPaths, navigation)
  // apply percent / calc
  const percentConfig: PercentConfig = {
    width,
    height,
    fontSize: normalStyle.fontSize,
    parentWidth,
    parentHeight
  }
  if (hasFont) transformFont(normalStyle)
  if (percentKeyPaths.length) transformPercent(normalStyle, percentKeyPaths, percentConfig)
  if (calcKeyPaths.length) {
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
  }

  // transform number enum stringify
  if (needStringify) transformStringify(normalStyle)
  // transform unit
  if (hasBoxShadow) transformBoxShadow(normalStyle)
  // transform 字符串格式转化数组格式
  if (hasTransform) transformTransform(normalStyle)
  // apply runtime style processing alignment
  if (hasFontFamily) transformFontFamily(normalStyle)
  if (hasFlex) transformFlex(normalStyle)
  if (shorthandKeys.length) transformShorthand(normalStyle, shorthandKeys, percentConfig)
  if (needTransformBackground) transformBackground(normalStyle)
  // borderStyle / outlineStyle: 'none' 的清除语义放到变量解析、简写展开之后统一处理。
  transformBorderStyleNone(normalStyle)
  // transform position: fixed
  const hasPositionFixed = transformPosition(normalStyle)
  // 合并组件默认样式：默认样式在 user transform 之后兜底写入，需完全符合 RN style 规范
  // 命中 user 已存在 key（含简写展开后的长属性）则跳过。
  // 复用同一次循环顺带补 hasBoxSizingAffectingStyle，避免独立扫一遍 default。
  if (defaultStyle) {
    for (const k in defaultStyle) {
      if (!hasOwn(defaultStyle, k)) continue
      if (!hasOwn(normalStyle, k)) normalStyle[k] = defaultStyle[k]
      if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(k)) {
        hasBoxSizingAffectingStyle = true
      }
    }
  }
  if (hasBoxSizingAffectingStyle) transformBoxSizing(normalStyle)

  return {
    hasVarDec,
    varContextRef,
    setWidth,
    setHeight,
    normalStyle,
    hasSelfPercent,
    hasPositionFixed
  }
}

// ============================================================
// other React hooks
// ============================================================

export function useNavigation (): Record<string, any> | undefined {
  const { navigation } = useContext(RouteContext) || {}
  return navigation
}

function getTextPercentBase (currentFontSize?: string | number, parentTextStyle?: TextStyle) {
  return typeof currentFontSize === 'number'
    ? currentFontSize
    : typeof parentTextStyle?.fontSize === 'number'
      ? parentTextStyle.fontSize
      : DEFAULT_FONT_SIZE
}

export function resolveTextPercentStyle<T extends TextStyle | undefined> (
  textStyle: T,
  parentTextStyle?: TextStyle
): T {
  if (!textStyle) return textStyle

  if (typeof textStyle.fontSize === 'string' && percentRegExp.test(textStyle.fontSize)) {
    const base = getTextPercentBase(undefined, parentTextStyle)
    textStyle.fontSize = parseFloat(textStyle.fontSize) / 100 * base
  }

  if (typeof textStyle.lineHeight === 'string' && percentRegExp.test(textStyle.lineHeight)) {
    const base = getTextPercentBase(textStyle.fontSize, parentTextStyle)
    textStyle.lineHeight = parseFloat(textStyle.lineHeight) / 100 * base
  }

  return textStyle
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
  // 固定首次 layout 前是否需要隐藏，避免 hasSelfPercent 后续变化时重新隐藏组件
  const layoutStyle = useMemo(() => { return !hasLayoutRef.current && hasSelfPercent ? hiddenStyle : undefined }, [hasLayoutRef.current])
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

  const resolvedTextStyle = resolveTextPercentStyle(textStyle, parent?.textStyle)
  const nextTextStyle = resolvedTextStyle
    ? extendObject({}, parent?.textStyle, resolvedTextStyle)
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
  const hoverRef = useRef<{
    startTimer?: ReturnType<typeof setTimeout>
    stayTimer?: ReturnType<typeof setTimeout>
    hoverStartTime: number
    hoverStayTime: number
    disabled?: boolean
  }>({ hoverStartTime, hoverStayTime, disabled })
  hoverRef.current.hoverStartTime = hoverStartTime
  hoverRef.current.hoverStayTime = hoverStayTime
  hoverRef.current.disabled = disabled

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    return () => {
      hoverRef.current.startTimer && clearTimeout(hoverRef.current.startTimer)
      hoverRef.current.stayTimer && clearTimeout(hoverRef.current.stayTimer)
    }
  }, [])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const gesture = useMemo(() => {
    const setStartTimer = () => {
      const data = hoverRef.current
      if (data.disabled) return
      data.startTimer && clearTimeout(data.startTimer)
      data.startTimer = setTimeout(() => {
        setIsHover(true)
      }, +data.hoverStartTime)
    }

    const setStayTimer = () => {
      const data = hoverRef.current
      if (data.disabled) return
      data.stayTimer && clearTimeout(data.stayTimer)
      data.startTimer && clearTimeout(data.startTimer)
      data.stayTimer = setTimeout(() => {
        setIsHover(false)
      }, +data.hoverStayTime)
    }

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

export function wrapChildren (children: ReactNode, { hasVarDec, varContext, textPassThrough }: WrapChildrenConfig) {
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
