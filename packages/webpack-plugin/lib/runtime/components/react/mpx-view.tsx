/**
 * ✔ hover-class
 * ✘ hover-stop-propagation
 * ✔ hover-start-time
 * ✔ hover-stay-time
 */
import { View, NativeSyntheticEvent, ViewProps, ImageStyle, StyleSheet, Image, LayoutChangeEvent } from 'react-native'
import { useRef, useState, useEffect, useMemo, forwardRef, ReactNode, JSX, createElement } from 'react'
import useInnerProps from './getInnerListeners'
import Animated from 'react-native-reanimated'
import useAnimationHooks, { AnimationType } from './animationHooks/index'
import type { AnimationProp } from './animationHooks/utils'
import { ExtendedViewStyle } from './types/common'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { parseUrl, percentRegExp, splitStyle, splitProps, useTransformStyle, wrapChildren, useLayout, renderImage, pickStyle, extendObject, useHover, useTextPassThrough } from './utils'
import { TextPassThroughContextValue } from './context'
import { error, warn, hasOwn } from '@mpxjs/utils'
import * as perf from '@mpxjs/perf'
import LinearGradient from 'react-native-linear-gradient'
import { GestureDetector, PanGesture } from 'react-native-gesture-handler'
import Portal from './mpx-portal'

export interface _ViewProps extends ViewProps {
  style?: ExtendedViewStyle
  animation?: AnimationProp
  children?: ReactNode | ReactNode[]
  'hover-style'?: ExtendedViewStyle
  'hover-start-time'?: number
  'hover-stay-time'?: number
  'enable-background'?: boolean
  'enable-text-pass-through'?: boolean
  'enable-var'?: boolean
  'enable-fast-image'?: boolean
  'parent-width'?: number
  'parent-height'?: number
  'enable-animation'?: boolean | AnimationType
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtransitionend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

type Size = {
  width: number
  height: number
}

type DimensionValue = number | `${number}%` | 'auto' | 'contain' | 'cover'

type Position = {
  left?: number
  right?: number
  top?: number
  bottom?: number
}

type PositionKey = keyof Position

type NumberVal = number | `${number}%`

type PositionVal = PositionKey | NumberVal

type backgroundPositionList = ['left' | 'right', NumberVal, 'top' | 'bottom', NumberVal] | []

type LinearInfo = {
  colors: Array<string>,
  locations: Array<number>,
  direction?: string
}

type PreImageInfo = {
  src?: string,
  sizeList: DimensionValue[]
  type?: 'image' | 'linear'
  linearInfo?: LinearInfo
  // containPercentSymbol?: boolean
  backgroundPosition: backgroundPositionList
}

type ImageProps = {
  style: ImageStyle,
  src?: string,
  source?: { uri: string },
  colors?: Array<string>,
  locations?: Array<number>
  angle?: number
  resizeMode?: 'cover' | 'stretch'
}

type LinearImageProps = ImageProps & {
  colors: Array<string>
}

const linearMap = new Map([
  ['top', 0],
  ['bottom', 180],
  ['left', 270],
  ['right', 90]
])

const FLEX_DEFAULT_STYLE: ExtendedViewStyle = {
  flexDirection: 'row',
  flexBasis: 'auto',
  flexShrink: 1,
  flexWrap: 'nowrap'
}
// 用户传入 flex shorthand 时使用的精简版（裁掉 flexBasis/flexShrink）
// 避免 number 形式 flex:1 被 default flexBasis:'auto' 反向覆盖
const FLEX_DEFAULT_STYLE_TRIMMED: ExtendedViewStyle = {
  flexDirection: 'row',
  flexWrap: 'nowrap'
}

// 对角线角度
const diagonalAngleMap: Record<string, (width: number, height: number) => any> = {
  'top right': (width: number, height: number) => {
    return Math.acos(
      (width / 2) /
      (Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2)
    )
  },
  'right top': (width, height) => { return diagonalAngleMap['top right'](width, height) },

  'bottom right': (width, height) => Math.PI - diagonalAngleMap['top right'](width, height),
  'right bottom': (width, height) => { return diagonalAngleMap['bottom right'](width, height) },

  'bottom left': (width, height) => Math.PI + diagonalAngleMap['top right'](width, height),
  'left bottom': (width, height) => { return diagonalAngleMap['bottom left'](width, height) },

  'top left': (width, height) => (2 * Math.PI) - diagonalAngleMap['top right'](width, height),
  'left top': (width, height) => { return diagonalAngleMap['top left'](width, height) }
}

// 弧度转化为角度的公式
function radToAngle (r: number) {
  return r * 180 / Math.PI
}

// === linear-gradient 解析相关正则（模块级，一次创建） ===
// CSS <angle> 支持 deg/turn/rad/grad 四种单位，统一归一为 deg
// https://www.w3.org/TR/css-values-3/#angles
const angleRegExp = /^\s*(-?\d+(?:\.\d+)?)(deg|turn|rad|grad)\b/
const gradientToRegExp = /^to\b\s*/
// 入口形态：仅在含 linear-gradient 时走解析；提取括号内内容
const linearGradientRegExp = /linear-gradient\((.*)\)/
// 顶层逗号切分（忽略 () / # 内部的逗号）
const topLevelCommaRegExp = /,(?![^(#]*\))/
// 色标内空白切分（忽略色函数里的逗号边界）
const stopWhitespaceRegExp = /(?<!,)\s+/
// 色标位置仅支持 `<n>%` 或裸 `0`（CSS 允许 0 作为唯一无单位 length）
// 其它单位（px/rpx/em/vw/...）当前无法在不依赖 layout 的情况下归一为百分比，统一拒绝
const validStopPosRegExp = /^-?\d+(?:\.\d+)?%$|^0$/
// color hint 检测：色标 token 仅含一个分量且以数字/正负号/小数点开头
const colorHintLeadingRegExp = /^[-+.\d]/

function normalizeAngle (raw: string): number | undefined {
  const m = raw.match(angleRegExp)
  if (!m) return undefined
  const n = +m[1]
  switch (m[2]) {
    case 'turn': return n * 360
    case 'rad': return radToAngle(n)
    case 'grad': return n * 0.9
    default: return n // deg
  }
}

const isPercent = (val: string | number | undefined): val is string => typeof val === 'string' && percentRegExp.test(val)

const isBackgroundSizeKeyword = (val: string | number): boolean => typeof val === 'string' && /^cover|contain$/.test(val)

const isNeedLayout = (preImageInfo: PreImageInfo): boolean => {
  const { sizeList, backgroundPosition, linearInfo, type } = preImageInfo
  const [width, height] = sizeList
  const bp = backgroundPosition

  // 含有百分号，center 需计算布局
  return isBackgroundSizeKeyword(width) ||
    (isPercent(height) && width === 'auto') ||
    (isPercent(width) && height === 'auto') ||
    isPercent(bp[1]) ||
    isPercent(bp[3]) ||
    isDiagonalAngle(linearInfo) ||
    (type === 'linear' && (isPercent(height) || isPercent(width)))
}

const checkNeedLayout = (preImageInfo: PreImageInfo) => {
  const { sizeList } = preImageInfo
  const [width] = sizeList
  // 在渐变的时候，background-size的cover，contain, auto属性值，转化为100%, needLayout计算逻辑和原来保持一致，needImageSize始终为false
  return {
    // 是否开启layout的计算
    needLayout: isNeedLayout(preImageInfo),
    // 是否开启原始宽度的计算
    needImageSize: isBackgroundSizeKeyword(width) || sizeList.includes('auto')
  }
}

/**
* h - 用户设置的高度
* lh - 容器的高度
* ratio - 原始图片的宽高比
* **/
function calculateSize (h: number, ratio: number, lh?: number | boolean, reverse = false): Size | null {
  let height = 0; let width = 0

  if (typeof lh === 'boolean') {
    reverse = lh
  }

  if (isPercent(h)) { // auto  px/rpx
    if (!lh) return null
    height = (parseFloat(h) / 100) * (lh as number)
    width = height * ratio
  } else { // 2. auto px/rpx - 根据比例计算
    height = h
    width = height * ratio
  }
  return {
    width: reverse ? height : width,
    height: reverse ? width : height
  }
}

/**
 * 用户设置百分比后，转换为偏移量
 * h - 用户设置图片的高度
 * ch - 容器的高度
 * val - 用户设置的百分比
 * **/
function calculateSizePosition (h: number, ch: number, val: string): number {
  if (!h || !ch) return 0

  // 百分比需要单独的计算
  if (isPercent(h)) {
    h = ch * parseFloat(h) / 100
  }

  // (container width - image width) * (position x%) = (x offset value)
  return (ch - h) * parseFloat(val) / 100
}

/**
* 获取图片的展示宽高
* h - 用户设置的高度
* lh - 容器的高度
* **/
const calcPercent = (h: NumberVal, lh: number) => {
  return isPercent(h) ? parseFloat(h) / 100 * lh : +h
}

function backgroundPosition (imageProps: ImageProps, preImageInfo: PreImageInfo, imageSize: Size, layoutInfo: Size) {
  const bps = preImageInfo.backgroundPosition
  if (bps.length === 0) return
  const style: Position = {}
  const imageStyle: ImageStyle = imageProps.style || {}

  for (let i = 0; i < bps.length; i += 2) {
    const key = bps[i] as PositionKey; const val = bps[i + 1]
    // 需要获取 图片宽度 和 容器的宽度 进行计算
    if (isPercent(val)) {
      if (i === 0) {
        style[key] = calculateSizePosition(imageStyle.width as number, layoutInfo?.width, val)
      } else {
        style[key] = calculateSizePosition(imageStyle.height as number, layoutInfo?.height, val)
      }
    } else {
      style[key] = val as number
    }
  }

  extendObject(imageProps.style, style)
}

// background-size 转换
function backgroundSize (imageProps: ImageProps, preImageInfo: PreImageInfo, imageSize: Size, layoutInfo: Size) {
  const { sizeList, type } = preImageInfo
  if (!sizeList) return
  const { width: layoutWidth, height: layoutHeight } = layoutInfo || {}
  const { width: imageSizeWidth, height: imageSizeHeight } = imageSize || {}
  const [width, height] = sizeList
  let dimensions: {
    width: NumberVal,
    height: NumberVal
  } | null = { width: 0, height: 0 }

  // 枚举值
  if (typeof width === 'string' && ['cover', 'contain'].includes(width)) {
    if (layoutInfo && imageSize) {
      const containerRatio = layoutWidth / layoutHeight
      const imageRatio = imageSizeWidth / imageSizeHeight
      // 容器宽高比 小于等于 图片宽高比：contain 按宽缩放，cover 按高缩放
      if ((containerRatio <= imageRatio && (width as string) === 'contain') || (containerRatio >= imageRatio && (width as string) === 'cover')) {
        dimensions = calculateSize(layoutWidth as number, imageSizeHeight / imageSizeWidth, true) as Size
      } else if ((containerRatio > imageRatio && (width as string) === 'contain') || (containerRatio < imageRatio && (width as string) === 'cover')) {
        dimensions = calculateSize(layoutHeight as number, imageSizeWidth / imageSizeHeight) as Size
      }
    }
  } else {
    if (width === 'auto' && height === 'auto') { // 均为auto
      if (!imageSize) return
      dimensions = {
        width: imageSizeWidth,
        height: imageSizeHeight
      }
    } else if (width === 'auto') { // auto px/rpx/%
      if (!imageSize) return
      dimensions = calculateSize(height as number, imageSizeWidth / imageSizeHeight, layoutInfo?.height)
      if (!dimensions) return
    } else if (height === 'auto') { // auto px/rpx/%
      if (!imageSize) return
      dimensions = calculateSize(width as number, imageSizeHeight / imageSizeWidth, layoutInfo?.width, true)
      if (!dimensions) return
    } else { // 数值类型      ImageStyle
      // 数值类型设置为 stretch
      imageProps.resizeMode = 'stretch'
      if (type === 'linear' && (!layoutWidth || !layoutHeight) && (isPercent(width) || isPercent(height))) {
        // ios 上 linear 组件只要重新触发渲染，在渲染过程中外层容器 width 或者 height 被设置为 0，通过设置 % 的方式会渲染不出来，即使后面再更新为正常宽高也渲染不出来
        // 所以 hack 手动先将 linear 宽高也设置为 0，后面再更新为正确的数值或 %。
        dimensions = {
          width: 0,
          height: 0
        } as { width: NumberVal, height: NumberVal }
      } else {
        dimensions = {
          width: isPercent(width) ? width : +width,
          height: isPercent(height) ? height : +height
        } as { width: NumberVal, height: NumberVal }
      }
    }
  }

  // 样式合并
  extendObject(imageProps.style, dimensions)
}

// background-image转换为source
function backgroundImage (imageProps: ImageProps, preImageInfo: PreImageInfo) {
  const src = preImageInfo.src
  if (src) {
    imageProps.source = { uri: src }
  }
}

// 渐变的转换
function linearGradient (imageProps: ImageProps, preImageInfo: PreImageInfo, imageSize: Size, layoutInfo: Size) {
  const { type, linearInfo } = preImageInfo
  const { colors = [], locations, direction = '' } = linearInfo || {}
  const { width, height } = imageSize || {}

  if (type !== 'linear') return

  // 角度计算
  // 注意：不要用 `linearMap.get(direction) || ...`，因为 'top' 映射为 0 是 falsy 值，
  // 会被误判为未命中并落到默认 180deg
  let angle: number
  if (linearMap.has(direction)) {
    angle = linearMap.get(direction) as number
  } else {
    const normalized = normalizeAngle(direction)
    angle = normalized !== undefined ? normalized : 180
  }
  angle = angle % 360

  // 对角线角度计算
  if (layoutInfo && diagonalAngleMap[direction] && imageSize && linearInfo) {
    angle = radToAngle(diagonalAngleMap[direction](width, height)) || 180
  }

  // 赋值
  imageProps.colors = colors
  imageProps.locations = locations
  imageProps.angle = angle
}

const imageStyleToProps = (preImageInfo: PreImageInfo, imageSize: Size, layoutInfo: Size) => {
  const { type } = preImageInfo
  const imageProps: ImageProps = {
    style: {
      position: 'absolute'
      // ...StyleSheet.absoluteFillObject
    }
  }

  if (type === 'image') {
    imageProps.resizeMode = 'cover'
  } else {
    imageProps.colors = []
  }

  backgroundSize(imageProps, preImageInfo, imageSize, layoutInfo)
  if (preImageInfo.backgroundPosition.length) {
    backgroundPosition(imageProps, preImageInfo, imageSize, layoutInfo)
  }
  if (type === 'image') {
    backgroundImage(imageProps, preImageInfo)
  } else {
    linearGradient(imageProps, preImageInfo, imageSize, layoutInfo)
  }

  return imageProps
}

function isHorizontal (val: PositionVal): val is 'left' | 'right' {
  return typeof val === 'string' && /^(left|right)$/.test(val)
}

function isVertical (val: PositionVal): val is 'top' | 'bottom' {
  return typeof val === 'string' && /^(top|bottom)$/.test(val)
}

function normalizeBackgroundPosition (parts: PositionVal[]): backgroundPositionList {
  if (parts.length === 0) return []

  // 定义默认值
  let hStart: 'left' | 'right' = 'left'
  let hOffset: PositionVal = 0
  let vStart: 'top' | 'bottom' = 'top'
  let vOffset: PositionVal = 0

  if (!Array.isArray(parts)) {
    // 模板 style 属性传入单个数值时不会和 class 一样转成数组，需要手动转换
    parts = [parts]
  }
  // 模板 style 属性传入时， 需要额外转换处理单位 px/rpx/vh 以及 center 转化为 50%
  parts = (parts as (PositionVal | string)[]).map((part) => {
    if (typeof part !== 'string') return part
    if (part === 'center') return '50%'
    return global.__formatValue(part) as PositionVal
  })

  if (parts.length === 4) return parts as backgroundPositionList

  // 归一化
  if (parts.length === 1) {
    // 1. center
    // 2. 2px - hOffset, vOffset(center) - center为50%
    // 3. 10% - hOffset, vOffset(center) - center为50%
    // 4. left - hStart, vOffset(center) - center为50%
    // 5. top - hOffset(center), vStart - center为50%

    if (isHorizontal(parts[0])) {
      hStart = parts[0]
      vOffset = '50%'
    } else if (isVertical(parts[0])) {
      vStart = parts[0]
      hOffset = '50%'
    } else {
      hOffset = parts[0]
      vOffset = '50%'
    }
  } else if (parts.length === 2) {
    // 1. center center - hOffset, vOffset
    // 2. 10px center - hOffset, vStart
    // 3. left center - hStart, vOffset
    // 4. right center - hStart, vOffset
    // 5. 第一位是 left right 覆盖的是 hStart
    //             center, 100% 正常的px 覆盖的是 hOffset
    //     第二位是 top bottom 覆盖的是 vStart
    //             center, 100% 覆盖的是 vOffset
    //
    // 水平方向
    if (isHorizontal(parts[0])) {
      hStart = parts[0]
    } else { // center, 100% 正常的px 覆盖的是 hOffset
      hOffset = parts[0]
    }
    // 垂直方向
    if (isVertical(parts[1])) {
      vStart = parts[1]
    } else { // center, 100% 正常的px 覆盖的是 hOffset
      vOffset = parts[1]
    }
  } else if (parts.length === 3) {
    // 1. center top 10px / top 10px center 等价 - center为50%
    // 2. right 10px center / center right 10px 等价 - center为50%
    // 2. bottom 50px right
    if (typeof parts[0] === 'string' && typeof parts[1] === 'string' && /^left|bottom|right|top$/.test(parts[0]) && /^left|bottom|right|top$/.test(parts[1])) {
      [hStart, vStart, vOffset] = parts as ['left' | 'right', 'top' | 'bottom', number]
    } else {
      [hStart, hOffset, vStart] = parts as ['left' | 'right', number, 'top' | 'bottom']
    }
  }

  return [hStart, hOffset, vStart, vOffset] as backgroundPositionList
}

/**
 *
 * calcSteps - 计算起始位置和终点位置之间的差值
 *    startVal - 起始位置距离
 *    endVal - 终点位置距离
 *    len - 数量
 * **/
function calcSteps (startVal: number, endVal: number, len: number) {
  const diffVal = endVal - startVal
  const step = diffVal / len
  const newArr: Array<number> = []
  for (let i = 1; i < len; i++) {
    const val = startVal + step * i
    newArr.push(+val.toFixed(2))
  }

  return newArr
}

// 返回值约定：
//   - LinearInfo  解析成功
//   - null        已识别为 linear-gradient 但内部已通过 error/warn 报错，外部不要再报
//   - undefined   不是 linear-gradient 形态，外部按"不支持的 background-image"处理
function parseLinearGradient (text: string): LinearInfo | null | undefined {
  let linearText = text.trim().match(linearGradientRegExp)?.[1]
  if (!linearText) return

  // 多重渐变 / 多重背景：linearGradientRegExp 用了贪婪 `.*`，多渐变时括号内
  // 会贪到下一段 `linear-gradient(`，单段则一定不含；用 includes 一次判断即可
  if (linearText.includes('linear-gradient(')) {
    error(`[mpx-view] background-image 暂不支持多重渐变 (multi gradients)，已丢弃，原值: ${text}`)
    return null
  }

  // 把 0deg, red 10%, blue 20% 解析为 ['0deg', 'red, 10%', 'blue, 20%']
  if (gradientToRegExp.test(linearText)) {
    linearText = linearText.replace(gradientToRegExp, '')
  } else if (!angleRegExp.test(linearText)) {
    linearText = '180deg ,' + linearText
  }
  const [direction, ...colorList] = linearText.split(topLevelCommaRegExp)
  // 记录需要填充起点的起始位置
  let startIdx = 0; let startVal = 0
  // 把 ['red, 10%', 'blue, 20%']解析为 [[red, 10%], [blue, 20%]]
  // 双位置语法展开：['red', '0%', '50%'] → [['red', '0%'], ['red', '50%']]
  // 等价于 CSS Images Level 4 中 `red 0% 50%` ≡ `red 0%, red 50%`
  // 同步对不支持的写法做拦截：color hint（仅一个位置 token）、非百分比位置（px/rpx 等）
  const linearInfo = colorList
    .map(item => item.trim().split(stopWhitespaceRegExp))
    .reduce<string[][]>((acc, parts) => {
      // color hint: 例如 `linear-gradient(red, 30%, blue)` 中的 `30%`
      // 该 token 仅含一个位置值、无颜色；当前实现无法做颜色采样，直接丢弃
      if (parts.length === 1 && colorHintLeadingRegExp.test(parts[0])) {
        warn(`[mpx-view] linear-gradient 暂不支持 color hint 写法 [${parts[0]}]，已丢弃该色标`)
        return acc
      }
      const [color, ...positions] = parts
      if (positions.length === 0) {
        acc.push([color])
      } else {
        for (const pos of positions) {
          if (!validStopPosRegExp.test(pos)) {
            warn(`[mpx-view] linear-gradient 色标位置仅支持百分比 [${color} ${pos}] 已丢弃位置，仅保留颜色`)
            acc.push([color])
          } else {
            acc.push([color, pos])
          }
        }
      }
      return acc
    }, [])
    .reduce<LinearInfo>((prev, cur, idx, self) => {
      const { colors, locations } = prev
      const [color, val] = cur
      let numberVal: number = parseFloat(val) / 100

      // 处理渐变默认值
      if (idx === 0) {
        numberVal = numberVal || 0
      } else if (self.length - 1 === idx) {
        numberVal = numberVal || 1
      }

      // 出现缺省值时进行填充
      if (idx - startIdx > 1 && !isNaN(numberVal)) {
        locations.push(...calcSteps(startVal, numberVal, idx - startIdx))
      }

      if (!isNaN(numberVal)) {
        startIdx = idx
        startVal = numberVal
      }

      // 添加color的数组
      colors.push(color.trim())

      !isNaN(numberVal) && locations.push(numberVal)
      return prev
    }, { colors: [], locations: [] })

  // 色标全部被丢弃或不足以构成渐变（至少 2 个颜色），降级返回
  if (linearInfo.colors.length < 2) {
    error(`[mpx-view] linear-gradient 至少需要 2 个有效色标，已丢弃，原值: ${text}`)
    return null
  }

  return extendObject({}, linearInfo, {
    direction: direction.trim()
  })
}

function parseBgImage (text?: string): {
  linearInfo?: LinearInfo
  direction?: string
  type?: 'image' | 'linear'
  src?: string
} {
  if (!text || text === 'none') return {}

  const src = parseUrl(text)
  if (src) return { src, type: 'image' }

  const linearInfo = parseLinearGradient(text)
  if (!linearInfo) {
    // null 表示 parseLinearGradient 内部已报错，外部不要重复；undefined 才属于未识别形态
    if (linearInfo === undefined) {
      error(`[mpx-view] background-image 暂不支持 ${text}，已丢弃，仅支持 url(...) / linear-gradient(...)。`)
    }
    return {}
  }
  return {
    linearInfo,
    type: 'linear'
  }
}

export const __parseBgImageForTest = (text?: string): any => parseBgImage(text)

function normalizeBackgroundSize (
  backgroundSize: NonNullable<ExtendedViewStyle['backgroundSize']>,
  type: 'image' | 'linear' | undefined
): DimensionValue[] {
  const sizeList = backgroundSize.slice()
  if (sizeList.length === 1) sizeList.push('auto')

  return sizeList.map((val) => {
    if (typeof val !== 'string') return val

    // 处理当使用渐变的时候，background-size出现cover, contain, auto，当作100%处理
    if (type === 'linear' && /^cover|contain|auto$/.test(val)) {
      val = '100%'
    }

    // 模板 style 属性传入时， 需要额外转换处理单位 px/rpx/vh
    return global.__formatValue(val) as DimensionValue
  })
}

function isDiagonalAngle (linearInfo?: LinearInfo): boolean {
  return !!(linearInfo?.direction && diagonalAngleMap[linearInfo.direction])
}

function inheritStyle (innerStyle: ExtendedViewStyle = {}) {
  const { borderWidth, borderRadius } = innerStyle
  const borderStyles = ['borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']
  return pickStyle(innerStyle,
    borderStyles,
    borderWidth && borderRadius
      ? (key, val) => {
        // 盒子内圆角borderWith与borderRadius的关系
        // 当borderRadius 小于 当borderWith 内边框为直角
        // 当borderRadius 大于等于 当borderWith 内边框为圆角
          if (borderStyles.includes(key)) {
            const borderVal = +val - borderWidth
            return borderVal > 0 ? borderVal : 0
          }
          return val
        }
      : undefined)
}

function useWrapImage (imageStyle?: ExtendedViewStyle, innerStyle?: Record<string, any>, enableFastImage?: boolean) {
  const backgroundImage = imageStyle?.backgroundImage
  const backgroundSize = imageStyle?.backgroundSize
  const backgroundPosition = imageStyle?.backgroundPosition
  const parsedImageInfo = useMemo(() => parseBgImage(backgroundImage), [backgroundImage])
  const { src, type } = parsedImageInfo
  const backgroundSizeKey = Array.isArray(backgroundSize) ? backgroundSize.join('|') : backgroundSize
  const sizeList = useMemo(
    () => normalizeBackgroundSize(backgroundSize ?? ['auto'], type),
    [backgroundSizeKey, type]
  )
  const backgroundPositionKey = Array.isArray(backgroundPosition) ? backgroundPosition.join('|') : backgroundPosition
  const bgPosition = useMemo(
    () => normalizeBackgroundPosition(backgroundPosition ?? [0, 0]),
    [backgroundPositionKey]
  )
  const preImageInfo: PreImageInfo = useMemo(
    () => extendObject({}, parsedImageInfo, { sizeList, backgroundPosition: bgPosition }),
    [parsedImageInfo, sizeList, bgPosition]
  )

  // 判断是否可挂载onLayout
  const { needLayout, needImageSize } = checkNeedLayout(preImageInfo)

  const [show, setShow] = useState<boolean>(((type === 'image' && !!src) || type === 'linear') && !needLayout && !needImageSize)
  const [version, setVersion] = useState(0)
  const sizeInfo = useRef<Size | null>(null)
  const layoutInfo = useRef<Size | null>(null)
  const sizeCacheRef = useRef<Map<string, Size>>(new Map())
  // sizeInfo / layoutInfo / setVersion 都是稳定引用，闭包整个生命周期只分配一次
  const { bumpVersion, setImageSize, setLayoutInfo } = useMemo(() => ({
    bumpVersion: () => setVersion(version => version + 1),
    setImageSize: (width: number, height: number) => {
      if (sizeInfo.current?.width === width && sizeInfo.current?.height === height) return false
      sizeInfo.current = { width, height }
      return true
    },
    setLayoutInfo: (width: number, height: number) => {
      if (layoutInfo.current?.width === width && layoutInfo.current?.height === height) return false
      layoutInfo.current = { width, height }
      return true
    }
  }), [])
  useEffect(() => {
    sizeInfo.current = null
    if (type === 'linear') {
      if (!needLayout) setShow(true)
      return
    }

    if (!src) {
      setShow(false)
      return
      // 一开始未出现，数据改变时出现
    } else if (!(needLayout || needImageSize)) {
      setShow(true)
      return
    }

    if (needImageSize) {
      const cached = sizeCacheRef.current.get(src)
      if (cached) {
        const imageSizeChanged = setImageSize(cached.width, cached.height)
        if (!needLayout || layoutInfo.current) {
          imageSizeChanged && bumpVersion()
          setShow(true)
        }
        return
      }
      let cancelled = false
      Image.getSize(src, (width, height) => {
        // cache 仍然填上，避免下次同 src 再发一次请求
        sizeCacheRef.current.set(src, { width, height })
        if (cancelled) return
        const imageSizeChanged = setImageSize(width, height)
        // 1. 当需要绑定onLayout 2. 获取到布局信息
        if (!needLayout || layoutInfo.current) {
          imageSizeChanged && bumpVersion()
          setShow(true)
        }
      })
      return () => { cancelled = true }
    }
    // type 添加type 处理无渐变 有渐变的场景
  }, [src, type, needLayout, needImageSize])

  const imageProps = useMemo(
    () => imageStyleToProps(preImageInfo, sizeInfo.current as Size, layoutInfo.current as Size),
    [preImageInfo, version]
  )

  if (!type) return null

  const onLayout = (res: LayoutChangeEvent) => {
    const { width, height } = res?.nativeEvent?.layout || {}
    // layoutInfo 总是更新，Image.getSize 回调要靠 layoutInfo.current 决定是否 setShow
    let changed = setLayoutInfo(width, height)
    if (!needImageSize) {
      // 有渐变角度的时候，才触发渲染组件
      if (type === 'linear') {
        changed = setImageSize(calcPercent(sizeList[0] as NumberVal, width), calcPercent(sizeList[1] as NumberVal, height)) || changed
      }
      changed && bumpVersion()
      setShow(true)
    } else if (sizeInfo.current) {
      changed && bumpVersion()
      setShow(true)
    }
    // needImageSize && !sizeInfo.current：等 Image.getSize 回调里 setShow(true)，此处不触发渲染
  }

  const backgroundProps: ViewProps = extendObject({ key: 'backgroundImage' }, needLayout ? { onLayout } : {},
    { style: extendObject({}, inheritStyle(innerStyle), StyleSheet.absoluteFillObject, { overflow: 'hidden' as const }) }
  )

  return createElement(View, backgroundProps,
    show && type === 'linear' && createElement(LinearGradient, extendObject({ useAngle: true }, imageProps as LinearImageProps)),
    show && type === 'image' && renderImage(imageProps, enableFastImage)
  )
}

interface WrapChildrenConfig {
  hasVarDec: boolean
  enableBackground?: boolean
  backgroundStyle?: ExtendedViewStyle
  varContext?: Record<string, any>
  textPassThrough?: TextPassThroughContextValue | null
  innerStyle?: Record<string, any>
  enableFastImage?: boolean
}

function wrapWithChildren (props: _ViewProps, { hasVarDec, enableBackground, backgroundStyle, varContext, textPassThrough, innerStyle, enableFastImage }: WrapChildrenConfig) {
  const children = wrapChildren(props.children, {
    hasVarDec,
    varContext,
    textPassThrough
  })

  if (!enableBackground) return children

  return [
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useWrapImage(backgroundStyle, innerStyle, enableFastImage),
    children
  ]
}

const _View = forwardRef<HandlerRef<View, _ViewProps>, _ViewProps>((viewProps, ref): JSX.Element => {
  // 性能探针 - total
  let idTotal = -1
  if (__mpx_perf_framework__) idTotal = perf.scopeStart('view:render:total')

  // ───── props 阶段 ─────
  let idProps = -1
  if (__mpx_perf_framework__) idProps = perf.scopeStart('view:render:props')
  const { textProps, innerProps: props = {} } = splitProps(viewProps)
  let {
    style = {},
    'hover-style': hoverStyle,
    'hover-start-time': hoverStartTime = 50,
    'hover-stay-time': hoverStayTime = 400,
    'enable-var': enableVar,
    'enable-background': enableBackground,
    'enable-text-pass-through': enableTextPassThrough,
    'enable-fast-image': enableFastImage,
    'enable-animation': enableAnimation,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    animation,
    bindtransitionend
  } = props

  const enableHover = !!hoverStyle
  const { isHover, gesture } = useHover({ enableHover, hoverStartTime, hoverStayTime })

  const styleObj: ExtendedViewStyle = isHover
    ? extendObject({}, style, hoverStyle as ExtendedViewStyle)
    : style
  if (__mpx_perf_framework__) perf.scopeEnd(idProps)

  // ───── style 阶段 ─────
  let idStyle = -1
  if (__mpx_perf_framework__) idStyle = perf.scopeStart('view:render:style')
  const {
    normalStyle,
    hasSelfPercent,
    hasPositionFixed,
    hasVarDec,
    varContextRef,
    setWidth,
    setHeight
  } = useTransformStyle(styleObj, {
    enableVar,
    parentWidth,
    parentHeight,
    // 基于合并后的 styleObj 判断（hover 状态切换 display 也能触发）
    // 用户传 flex shorthand 时使用精简 default，避免 flexBasis/flexShrink 反向覆盖
    defaultStyle: styleObj.display === 'flex'
      ? (hasOwn(styleObj, 'flex') ? FLEX_DEFAULT_STYLE_TRIMMED : FLEX_DEFAULT_STYLE)
      : undefined
  })

  const { textStyle, backgroundStyle, innerStyle = {} } = splitStyle(normalStyle)
  const textPassThrough = useTextPassThrough(textStyle, textProps, { enableTextPassThrough })

  enableBackground = enableBackground || !!backgroundStyle
  const enableBackgroundRef = useRef(enableBackground)
  if (enableBackgroundRef.current !== enableBackground) {
    error('[Mpx runtime error]: background use should be stable in the component lifecycle, or you can set [enable-background] with true.')
  }

  const nodeRef = useRef(null)
  useNodesRef<View, _ViewProps>(props, ref, nodeRef, {
    style: normalStyle
  })

  const {
    layoutRef,
    layoutStyle,
    layoutProps
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

  const viewStyle = layoutStyle
    ? extendObject({}, innerStyle, layoutStyle)
    : innerStyle
  const { enableStyleAnimation, animationStyle } = useAnimationHooks({
    layoutRef,
    animation,
    enableAnimation,
    style: viewStyle,
    bindtransitionend
  })
  if (__mpx_perf_framework__) perf.scopeEnd(idStyle)

  // ───── innerProps 阶段 ─────
  let idInnerProps = -1
  if (__mpx_perf_framework__) idInnerProps = perf.scopeStart('view:render:innerProps')
  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      layoutProps,
      {
        ref: nodeRef,
        style: enableStyleAnimation ? [viewStyle, animationStyle] : viewStyle
      }
    ),
    [
      'hover-start-time',
      'hover-stay-time',
      'hover-style',
      'hover-class',
      'enable-background',
      'enable-animation',
      'enable-fast-image',
      'animation',
      'bindtransitionend'
    ],
    {
      layoutRef
    }
  )
  if (__mpx_perf_framework__) perf.scopeEnd(idInnerProps)

  // ───── createElement 阶段 ─────
  let idCreate = -1
  if (__mpx_perf_framework__) idCreate = perf.scopeStart('view:render:createElement')
  const childNode = wrapWithChildren(props, {
    hasVarDec,
    enableBackground: enableBackgroundRef.current,
    backgroundStyle,
    varContext: varContextRef.current,
    textPassThrough,
    innerStyle,
    enableFastImage
  })

  let finalComponent: JSX.Element = enableStyleAnimation
    ? createElement(Animated.View, innerProps, childNode)
    : createElement(View, innerProps, childNode)

  if (enableHover) {
    finalComponent = createElement(GestureDetector, { gesture: gesture as PanGesture }, finalComponent)
  }

  if (hasPositionFixed) {
    finalComponent = createElement(Portal, null, finalComponent)
  }
  if (__mpx_perf_framework__) perf.scopeEnd(idCreate)

  if (__mpx_perf_framework__) perf.scopeEnd(idTotal)
  return finalComponent
})

_View.displayName = 'MpxView'

export default _View
