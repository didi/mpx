import { useEffect, useMemo, useRef } from 'react'
import {
  Easing,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withSequence,
  withDelay,
  makeMutable,
  cancelAnimation,
  SharedValue,
  WithTimingConfig,
  AnimationCallback
} from 'react-native-reanimated'
import { ExtendedViewStyle } from './types/common'
import type { _ViewProps } from './mpx-view'

// type TransformKey = 'translateX' | 'translateY' | 'rotate' | 'rotateX' | 'rotateY' | 'rotateZ' | 'scaleX' | 'scaleY' | 'skewX' | 'skewY'
// type NormalKey = 'opacity' | 'backgroundColor' | 'width' | 'height' | 'top' | 'right' | 'bottom' | 'left' | 'transformOrigin'
// type RuleKey = TransformKey | NormalKey
type AnimatedOption = {
  duration: number
  delay: number
  useNativeDriver: boolean
  timingFunction: 'linear' | 'ease' | 'ease-in' | 'ease-in-out'| 'ease-out'
  transformOrigin: string
}
type ExtendWithTimingConfig = WithTimingConfig & {
  delay: number
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
const TransformInitial: ExtendedViewStyle = {
  // matrix: 0,
  // matrix3d: 0,
  rotate: '0deg',
  rotateX: '0deg',
  rotateY: '0deg',
  rotateZ: '0deg',
  // rotate3d:[0,0,0]
  scale: 1,
  // scale3d: [1, 1, 1],
  scaleX: 1,
  scaleY: 1,
  // scaleZ: 1,
  skew: 0,
  skewX: '0deg',
  skewY: '0deg',
  translate: 0,
  // translate3d: 0,
  translateX: 0,
  translateY: 0
  // translateZ: 0,
}
// 动画默认初始值
const InitialValue: ExtendedViewStyle = {
  ...TransformInitial,
  opacity: 1,
  backgroundColor: 'transparent',
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  transformOrigin: ['50%', '50%', 0]
}
const TransformOrigin = 'transformOrigin'
// deg 角度
// const isDeg = (key: RuleKey) => ['rotateX', 'rotateY', 'rotateZ', 'rotate', 'skewX', 'skewY'].includes(key)
// 背景色
// const isBg = (key: RuleKey) => key === 'backgroundColor'
// transform
const isTransform = (key: string) => Object.keys(TransformInitial).includes(key)

export default function useAnimationHooks<T, P> (props: _ViewProps) {
  const { style: originalStyle = {}, animation } = props
  // id 标识
  const id = animation?.id || -1
  // 有动画样式的 style key
  const animatedStyleKeys = useSharedValue([] as (string|string[])[])
  const animatedKeys = useRef([TransformOrigin] as string[])
  // ** 全量 style prop sharedValue
  // 不能做增量的原因：
  // 1 尝试用 useRef，但 useAnimatedStyle 访问后的 ref 不能在增加新的值，被冻结
  // 2 尝试用 useSharedValue，因为实际触发的 style prop 需要是 sharedValue 才能驱动动画，若外层 shareValMap 也是 sharedValue，动画无法驱动。
  const shareValMap = useMemo(() => {
    return Object.keys(InitialValue).reduce((valMap, key) => {
      const defaultVal = getInitialVal(key, isTransform(key))
      valMap[key] = makeMutable(defaultVal)
      return valMap
    }, {} as { [propName: keyof ExtendedViewStyle]: SharedValue<string|number> })
  }, [])
  // ** 获取动画样式prop & 驱动动画
  useEffect(() => {
    if (id === -1) return
    // 更新动画样式 key map
    animatedKeys.current = [...new Set(getAnimatedStyleKeys())]
    animatedStyleKeys.value = formatAnimatedKeys(animatedKeys.current)
    // 驱动动画
    createAnimation(animatedKeys.current)
  }, [id])
  // ** 清空动画
  useEffect(() => {
    return () => {
      Object.values(shareValMap).forEach((value) => {
        cancelAnimation(value)
      })
    }
  }, [])
  // 根据 animation action 创建&驱动动画 key => wi
  function createAnimation (animatedKeys: string[] = []) {
    const actions = animation?.actions || []
    const sequence = {} as { [propName: keyof ExtendedViewStyle]: (string|number)[] }
    actions.forEach(({ animatedOption, rules, transform }, index) => {
      const { delay, duration, timingFunction, transformOrigin } = animatedOption
      const easing = EasingKey[timingFunction] || Easing.inOut(Easing.quad)
      let isSetTransformOrigin = false
      const setTransformOrigin: AnimationCallback = (finished: boolean) => {
        'worklet'
        // 动画结束后设置下一次transformOrigin
        if (finished) {
          if (index < actions.length - 1) {
            const transformOrigin = actions[index + 1].animatedOption?.transformOrigin
            transformOrigin && (shareValMap[TransformOrigin].value = transformOrigin)
          }
        }
      }
      // 添加每个key的多次step动画
      animatedKeys.forEach(key => {
        if (key === TransformOrigin) {
          // 设置当次中心
          index === 0 && (shareValMap[TransformOrigin].value = transformOrigin)
          return
        }
        let toVal = rules.get(key) || transform.get(key)
        if (!toVal && index === 0) {
          // 第一轮key不存在 先取上一次动画的value(animation更新多次的前一次) 否则取默认值
          toVal = shareValMap[key] ? shareValMap[key].value : getInitialVal(key, isTransform(key))
        }
        if (!toVal && index > 0) {
          const { rules: lastRules, transform: lastTransform } = actions[index - 1]
          // 非第一轮取上一轮的
          toVal = lastRules.get(key) || lastTransform.get(key)
        }
        const animation = getAnimation({ key, value: toVal! }, { delay, duration, easing }, !isSetTransformOrigin && setTransformOrigin)
        isSetTransformOrigin = true
        if (!sequence[key]) {
          sequence[key] = [animation]
        } else {
          sequence[key].push(animation)
        }
      })
      // 赋值驱动动画
      animatedKeys.forEach((key) => {
        if (key !== TransformOrigin) {
          const animations = sequence[key]
          shareValMap[key].value = withSequence(...animations)
        }
      })
    })
  }
  // 创建单个animation
  function getAnimation ({ key, value }: { key: string, value: string|number }, { delay, duration, easing }: ExtendWithTimingConfig, callback: boolean | AnimationCallback = false) {
    const animation = typeof callback === 'function'
      ? withTiming(value, { duration, easing }, callback)
      : withTiming(value, { duration, easing })
    return delay ? withDelay(delay, animation) : animation
  }
  // 获取初始值（prop style or 默认值）
  function getInitialVal (key: keyof ExtendedViewStyle, isTransform = false) {
    if (isTransform && originalStyle.transform?.length) {
      let initialVal = InitialValue[key]
      // 仅支持 { transform: [{rotateX: '45deg'}, {rotateZ: '0.785398rad'}] } 格式的初始样式
      originalStyle.transform.forEach(item => {
        if (item[key] !== undefined) initialVal = item[key]
      })
      return initialVal
    }
    return originalStyle[key] === undefined ? InitialValue[key] : originalStyle[key]
  }
  // 循环 animation actions 获取所有有动画的 style prop name
  function getAnimatedStyleKeys () {
    return (animation?.actions || []).reduce((keys, action) => {
      const { rules, transform } = action
      keys.push(...rules.keys(), ...transform.keys())
      return keys
    }, [...animatedKeys.current])
  }
  // animated key transform 格式化
  function formatAnimatedKeys ( keys: string[] = []) {
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
  // transform 数组转对象
  function getTransformObj () {
    'worklet'
    const transforms = originalStyle.transform || []
    return transforms.reduce((transformObj, item) => {
      return Object.assign(transformObj, item)
    }, {} as { [propName: string]: string | number })
  }
  // ** 生成动画样式
  return useAnimatedStyle(() => {
    // console.info(`useAnimatedStyle styles=`, originalStyle)
    return animatedStyleKeys.value.reduce((styles, key) => {
      // console.info('getAnimationStyles', key, shareValMap[key].value)
      if (Array.isArray(key)) {
        const transformStyle = getTransformObj()
        key.forEach((transformKey) => {
          transformStyle[transformKey] = shareValMap[transformKey].value
        })
        styles.transform = Object.entries(transformStyle).map(([key, value]) => {
          return { [key]: value }
        })
      } else {
        styles[key] = shareValMap[key].value
      }
      return styles
    }, Object.assign({}, originalStyle) as ExtendedViewStyle)
  })
}
