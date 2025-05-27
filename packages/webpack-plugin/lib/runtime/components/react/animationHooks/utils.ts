import {
  Easing,
  withTiming,
  withDelay
  // useSharedValue,
  // useAnimatedStyle,
  // withSequence,
  // makeMutable,
  // cancelAnimation,
  // runOnJS
} from 'react-native-reanimated'
import type { AnimatableValue, WithTimingConfig, AnimationCallback } from 'react-native-reanimated'
import type { ExtendedViewStyle } from '../types/common'

export type TimingFunction = 'linear' | 'ease' | 'ease-in' | 'ease-in-out'| 'ease-out'

export type AnimatedOption = {
  duration: number
  delay?: number
  useNativeDriver?: boolean
  timingFunction?: TimingFunction
  transformOrigin?: string
}
export type ExtendWithTimingConfig = WithTimingConfig & {
  delay?: number
}
export type AnimationStepItem = {
  animatedOption: AnimatedOption
  rules: Map<string, number | string>
  transform: Map<string, number>
}
export type AnimationProp = {
  id: number,
  actions: AnimationStepItem[]
}

export type CustomAnimationCallback = (finished?: boolean, current?: AnimatableValue, duration?: number) => void

export type TransitionMap = {
  [propName: string]: AnimatedOption
}

// ms s 单位匹配
export const secondRegExp = /^\s*(\d*(?:\.\d+)?)(s|ms)\s*$/
// export const NumberExp = /^((opacity|flex-grow|flex-shrink|gap|left|right|top|bottom)|(.+-(width|height|left|right|top|bottom|radius|spacing|size|gap|index|offset|opacity)))$/
// export const ColorExp = /^(color|(.+Color))$/
// transform
export const Transform = 'transform'
export const TransformOrigin = 'transformOrigin'

// 微信 timingFunction 和 RN Easing 对应关系
export const EasingKey = {
  linear: Easing.linear,
  ease: Easing.inOut(Easing.ease),
  'ease-in': Easing.in(Easing.poly(3)),
  'ease-in-out': Easing.inOut(Easing.poly(3)),
  'ease-out': Easing.out(Easing.poly(3))
  // 'step-start': '',
  // 'step-end': ''
}
export const TransformInitial: ExtendedViewStyle = {
  // matrix: 0,
  // matrix3d: 0,
  // rotate: '0deg',
  rotateX: '0deg',
  rotateY: '0deg',
  rotateZ: '0deg',
  // rotate3d:[0,0,0]
  // scale: 1,
  // scale3d: [1, 1, 1],
  scaleX: 1,
  scaleY: 1,
  // scaleZ: 1,
  // skew: 0,
  skewX: '0deg',
  skewY: '0deg',
  // translate: 0,
  // translate3d: 0,
  translateX: 0,
  translateY: 0
  // translateZ: 0,
}
// 动画默认初始值
export const InitialValue: ExtendedViewStyle = Object.assign({
  opacity: 1,
  backgroundColor: 'transparent',
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  transformOrigin: ['50%', '50%', 0]
}, TransformInitial)
export const SupportedProperty = Object.assign({
  color: 'transparent',
  borderColor: 'transparent',
  borderBottomColor: 'transparent',
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
  borderTopColor: 'transparent',
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  borderRadius: 0,
  borderBottomWidth: 0,
  borderLeftWidth: 0,
  borderRightWidth: 0,
  borderTopWidth: 0,
  borderWidth: 0,
  margin: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  marginTop: 0,
  marginHorizontal: 0,
  marginVertical: 0,
  maxHeight: 0,
  maxWidth: 0,
  minHeight: 0,
  minWidth: 0,
  padding: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingHorizontal: 0,
  paddingVertical: 0,
  fontSize: 0, // Todo
  letterSpacing: 0 // Todo
}, InitialValue)

// export type PropertyType = keyof SupportedProperty

// transform
export const isTransform = (key: string) => Object.keys(TransformInitial).includes(key)

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

// parse string transform, eg: transform: 'rotateX(45deg) rotateZ(0.785398rad)'
export function parseTransform (transformStr: string) {
  const values = parseValues(transformStr)
  const transform: {[propName: string]: string|number|number[]}[] = []
  values.forEach(item => {
    const match = item.match(/([/\w]+)\((.+)\)/)
    if (match && match.length >= 3) {
      let key = match[1]
      const val = match[2]
      switch (key) {
        case 'translateX':
        case 'translateY':
        case 'scaleX':
        case 'scaleY':
        case 'rotateX':
        case 'rotateY':
        case 'rotateZ':
        case 'rotate':
        case 'skewX':
        case 'skewY':
        case 'perspective':
          // rotate 处理成 rotateZ
          key = key === 'rotate' ? 'rotateZ' : key
          // 单个值处理
          transform.push({ [key]: global.__formatValue(val) })
          break
        case 'matrix':
          transform.push({ [key]: parseValues(val, ',').map(val => +val) })
          break
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
      }
    }
  })
  return transform
}
// format style
export function formatStyle (style: ExtendedViewStyle): ExtendedViewStyle {
  if (!style.transform || Array.isArray(style.transform)) return style
  return Object.assign({}, style, {
    transform: parseTransform(style.transform)
  })
}
// transform 数组转对象
export function getTransformObj (transforms: { [propName: string]: string | number }[]) {
  'worklet'
  return transforms.reduce((transformObj, item) => {
    return Object.assign(transformObj, item)
  }, {} as { [propName: string]: string | number })
}
// 获取样式初始值（prop style or 默认值）
export function getInitialVal (style: ExtendedViewStyle, key: string) {
  if (isTransform(key) && Array.isArray(style.transform)) {
    let initialVal = SupportedProperty[key]
    // 仅支持 { transform: [{rotateX: '45deg'}, {rotateZ: '0.785398rad'}] } 格式的初始样式
    style.transform.forEach(item => {
      if (item[key] !== undefined) initialVal = item[key]
    })
    return initialVal
  }
  return style[key] === undefined ? SupportedProperty[key] : style[key]
}
// animated key transform 格式化
export function formatAnimatedKeys (keys: string[]) {
  const animatedKeys = [] as (string|string[])[]
  const transforms = [] as string[]
  keys.forEach(key => {
    if (isTransform(key)) {
      transforms.push(key)
    } else {
      animatedKeys.push(key)
    }
  })
  if (transforms.length) animatedKeys.push(transforms)
  return animatedKeys
}
// 解析动画时长
export function getUnit (duration: string) {
  const match = secondRegExp.exec(duration)
  return match ? match[2] === 's' ? +match[1] * 1000 : +match[1] : 0
}

// 根据动画数据创建单个animation
export function getAnimation ({ key, value }: { key: string, value: string|number }, { delay = 0, duration, easing }: ExtendWithTimingConfig, callback?: AnimationCallback) {
  const animation = typeof callback === 'function'
    ? withTiming(value, { duration, easing }, callback)
    : withTiming(value, { duration, easing })
  return delay ? withDelay(delay, animation) : animation
}
