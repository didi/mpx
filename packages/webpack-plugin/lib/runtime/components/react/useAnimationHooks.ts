import { useRef } from 'react'
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native'
import type { _ViewProps } from './mpx-view'

type TransformKey = 'translateX' | 'translateY' | 'rotate' | 'rotateX' | 'rotateY' | 'rotateZ' | 'scaleX' | 'scaleY' | 'skewX' | 'skewY'
type NormalKey = 'opacity' | 'backgroundColor' | 'width' | 'height' | 'top' | 'right' | 'bottom' | 'left'
type RuleKey = TransformKey | NormalKey
type RulesMap = Map<RuleKey, {
  animated: Animated.Value,
  inputRange: number[]
  outputRange: string[]
}>
type AnimatedOption = {
  duration: number
  delay: number
  useNativeDriver: boolean
  timingFunction: 'linear' | 'ease' | 'ease-in' | 'ease-in-out'| 'ease-out'
  transformOrigin: string
}
export type AnimationStepItem = {
  animatedOption: AnimatedOption
  rules: Map<NormalKey, number | string>
  transform: Map<TransformKey, number>
}

export type AnimationProp = {
  id: number,
  actions: AnimationStepItem[]
}
// 微信 timingFunction 和 RN Easing 对应关系
const EasingKey = {
  linear: Easing.linear,
  ease: Easing.ease,
  'ease-in': Easing.in(Easing.ease),
  'ease-in-out': Easing.inOut(Easing.ease),
  'ease-out': Easing.out(Easing.ease)
  // 'step-start': '',
  // 'step-end': ''
}
const TransformInitial = {
  // matrix: 0,
  // matrix3d: 0,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  // rotate3d:[0,0,0]
  scale: 1,
  // scale3d: [1, 1, 1],
  scaleX: 1,
  scaleY: 1,
  // scaleZ: 1,
  skew: 0,
  skewX: 0,
  skewY: 0,
  translate: 0,
  // translate3d: 0,
  translateX: 0,
  translateY: 0,
  // translateZ: 0,
}
// 动画默认初始值
const InitialValue = {
  ...TransformInitial,
  opacity: 1,
  backgroundColor: 'transparent',
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
}
// deg 角度
const isDeg = (key: RuleKey) => ['rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY', 'rotate'].includes(key)
// 背景色
const isBg = (key: RuleKey) => key === 'backgroundColor'
// transform
const isTransform = (key: RuleKey) => Object.keys(TransformInitial).includes(key)

export default function useAnimationHooks<T, P>(props: _ViewProps) {
  // 动画规则 map
  const rulesMap = useRef(new Map() as RulesMap)
  // id 标识
  let idRef = useRef(-1)
  const {
    style = [],
    animation
  } = props
  if (!animation || !animation.actions || !animation.actions.length) return {} as ViewStyle
  const actions = animation.actions
  const originalStyle: ViewStyle = StyleSheet.flatten(style)

  /** 根据 ruleMap 获取对应的 animation style   */
  const getAnimationStyle = () => {
    return [...rulesMap.current.entries()].reduce((style, [key, value]) => {
      const { animated, inputRange, outputRange } = value
      if (isTransform(key)) {
        key = key as TransformKey
        const transform = style.transform || originalStyle.transform || []
        transform.push({ [key]: outputRange.length && inputRange.length ? animated.interpolate({ inputRange, outputRange }) : animated })
        style['transform'] = transform
      } else {
        key = key as NormalKey
        style[key] = outputRange.length && inputRange.length ? animated.interpolate({ inputRange, outputRange }) : animated
      }
      return style
    }, {} as ViewStyle)
  }
  if (idRef.current === animation.id) {
    // animation id 未变化 直接映射出 style
    const transformOrigin = actions[actions.length - 1].animatedOption?.transformOrigin || ''
    const style = getAnimationStyle()
    return transformOrigin ? {
      transformOrigin,
      ...style,
    } : style
  }
  /** 获取动画实例 */
  const getParallelsAnimation = (
    {
      key,
      value,
      fromVal
    }: {
      key: RuleKey,
      value: string | number
      fromVal: string | number
    },
    {
      delay,
      duration,
      timingFunction
    }: AnimatedOption
  ) => {
    if (!rulesMap.current.has(key)) {
      const animated = new Animated.Value(isBg(key) ? 0 : +fromVal)
      const inputRange = (isBg(key) ? [0, 1] : isDeg(key) ? [0, 360] : []) as number[]
      const outputRange = (isBg(key) ? [fromVal, value] : isDeg(key) ? ['0deg', '360deg'] : []) as string[]
      rulesMap.current.set(key, {
        animated,
        inputRange,
        outputRange
      })
    }
    const animated = rulesMap.current.get(key)!.animated
    if (!EasingKey[timingFunction]) {
      console.error(`React Native 不支持 timingFunction = ${timingFunction}，请重新设置`)
    }
    return Animated.timing(animated, {
      toValue: isBg(key) ? 1 : +value,
      duration,
      delay,
      // Todo 有 width height 动画时不能设置为 true
      useNativeDriver: !(rulesMap.current.has('width') || rulesMap.current.has('height')),
      ...EasingKey[timingFunction] ? { easing: EasingKey[timingFunction] } : {}
    })
  }
  /** 获取初始值 */
  const getInitialVal = (key: RuleKey) => {
    let initialVal
    if (isTransform(key) && Array.isArray(originalStyle.transform) && originalStyle.transform?.length) {
      // 仅支持 { transform: [{rotateX: '45deg'}, {rotateZ: '0.785398rad'}] } 格式的初始样式
      originalStyle.transform.forEach(item => {
        key = key as TransformKey
        initialVal = item[key] !== undefined
          ? isDeg(key)
            ? +(`${item[key]}`.replace(/[^0-9]/ig,''))
            : item[key]
          : InitialValue[key]
      })
    } else {
      key = key as NormalKey
      initialVal = originalStyle[key] === undefined ? InitialValue[key] : originalStyle[key]
    }
    return initialVal as string | number
  }

  /** 创建&播放动画 */
  const createAnimation = () => {
    const animationStyle: ViewStyle = {}
    const steps = actions.map(({ animatedOption, rules, transform }) => {
      // 设置 transformOrigin
      if (animatedOption.transformOrigin) {
        Object.assign(animationStyle, {
          transformOrigin: animatedOption.transformOrigin
        })
      }
      // 获取动画序列
      const parallels = [
        ...rules.entries(),
        ...transform.entries()
      ].reduce((arr, [key, value]) => {
        const fromVal = getInitialVal(key) // fromVal toVal
        const animation = getParallelsAnimation({ key, value, fromVal }, animatedOption)
        animation && arr.push(animation)
        return arr
      }, [] as Animated.CompositeAnimation[])
      return Animated.parallel(parallels)
    })
    Object.assign(animationStyle, getAnimationStyle())
    Animated.sequence(steps).start(({ finished }) => {
      console.error('is finished ?', finished) // Todo
    });
    // 更新id
    idRef.current = animation.id

    return animationStyle
  }
  return createAnimation()
}
