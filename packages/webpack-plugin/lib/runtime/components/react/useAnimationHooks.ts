import { useRef, useEffect, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import {
  Easing,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withSequence,
  withDelay,
  makeMutable
  // withRepeat,
  // Extrapolation,
  // interpolate,
  // interpolateColor,
  // runOnJS,
  // runOnUI
} from 'react-native-reanimated'
import type  { ViewStyle } from 'react-native'
import type { _ViewProps } from './mpx-view'
import { throwReactWarning } from './utils'

type TransformKey = 'translateX' | 'translateY' | 'rotate' | 'rotateX' | 'rotateY' | 'rotateZ' | 'scaleX' | 'scaleY' | 'skewX' | 'skewY'
type NormalKey = 'opacity' | 'backgroundColor' | 'width' | 'height' | 'top' | 'right' | 'bottom' | 'left' | 'transformOrigin'
type RuleKey = TransformKey | NormalKey
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
  left: 0,
  transformOrigin: ['center', 'center', 0]
}
// deg 角度
const isDeg = (key: RuleKey) => ['rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY', 'rotate'].includes(key)
// 背景色
// const isBg = (key: RuleKey) => key === 'backgroundColor'
// transform
const isTransform = (key: RuleKey) => Object.keys(TransformInitial).includes(key)

export default function useAnimationHooks<T, P>(props: _ViewProps) {
  const { style, animation } = props
  // id 标识
  let idRef = useRef( -1)
  const originalStyle: ViewStyle = StyleSheet.flatten(style)
  // 有动画样式的 style key
  const animatedStyleKeys = useSharedValue([])
  // Todo 缓存 style 更新的时候变更
  // 生成 key: useSharedValue(val) 的 Map
  const shareValMap = useMemo(() => {
    return Object.keys(InitialValue).reduce((valMap, key) => {
      const defaultVal = getInitialVal(key, isTransform(key))
      valMap[key] = makeMutable(isDeg(key) ? `${defaultVal}deg` : defaultVal)
      return valMap
    }, {})
  }, [])
  // runOnUI(() => {
  //   Object.keys(shareValMap).forEach((key) => {
  //     console.info('shareValMap: valMap=', key, shareValMap[key].value)
  //   })
  // })()
  // console.info(`idRef.current=${idRef.current}`)
  // 更新 animation id
  idRef.current = animation?.id || -1
  useEffect(() => {
    if (idRef.current === -1) return
    // console.info(`useEffect idRef.current=${idRef.current}`)
    // 更新动画样式 key map
    const keys = getAnimatedStyleKeys()
    animatedStyleKeys.value = formatAnimatedKeys(keys)
    // 驱动动画
    createAnimation(keys)
  }, [idRef.current])
  // 根据 animation action 创建&驱动动画 key => wi
  function createAnimation(animatedKeys = []) {
    const actions = animation?.actions || []
    const sequence = {}
    actions.forEach(({ animatedOption, rules, transform }, index) => {
      const { delay, duration, timingFunction, transformOrigin } = animatedOption
      const allRules = [
        ...rules.entries(),
        ...transform.entries()
      ]
      const easing = EasingKey[timingFunction]
      if (!easing) {
        throwReactWarning(`React Native 不支持 timingFunction = ${timingFunction}，请重新设置`)
      }
      // 添加有动画的key
      allRules.forEach(([key, value]) => {
        const animation = getAnimation({ key, value }, { delay, duration, easing })
        if (!sequence[key]) {
          sequence[key] = [animation]
        } else {
          sequence[key].push(animation)
        }
      })
      // 本轮无动画的key补缺
      animatedKeys.forEach(key => {
        const defaultVal = getInitialVal(key, isTransform(key))
        if (!sequence[key]) {
          // console.info('本轮无动画的key补缺: defaultVal', defaultVal)
          const animation = getAnimation({ key, value: defaultVal }, { delay, duration, easing })
          sequence[key] = [animation]
        } else if (sequence[key].length < index + 1) {
          const { rules, transform } = actions[index - 1]
          const toVal = rules.get(key) || transform.get(key) || defaultVal
          // console.info(`rules.get(key)=${rules.get(key)} transform.get(key)=${transform.get(key)}`, toVal, '补缺')
          const animation = getAnimation({ key, value: toVal }, { delay, duration, easing })
          sequence[key].push(animation)
        }
      })
      // 驱动赋值
      animatedKeys.forEach((key) => {
        if (key === 'transformOrigin')  {
          shareValMap[key].value = transformOrigin.split(' ')
        } else {
          const animations = sequence[key]
          // console.info(index, key, animations, 999222)
          shareValMap[key].value = withSequence(...animations)
          // console.info(shareValMap[key].value, 999333)
        }
      })
    })
  }
  // 创建单个animation
  function getAnimation({ key, value }, { delay, duration, easing }) {
    // console.info('getAnimation key value', key, isDeg(key) ? `${value}deg` : value)
    const animation = withTiming(isDeg(key) ? `${value}deg` : value, { duration, easing })
    return delay ? withDelay(delay, animation) : animation
  }
  // 获取初始值（prop style or 默认值）
  function getInitialVal (key: RuleKey, isTransform = false) {
    if (isTransform && originalStyle.transform?.length) {
      let initialVal = InitialValue[key]
      // 仅支持 { transform: [{rotateX: '45deg'}, {rotateZ: '0.785398rad'}] } 格式的初始样式
      originalStyle.transform.forEach(item => {
        key = key as TransformKey
        // if (item[key] !== undefined) initialVal = item[key]
        if (item[key] !== undefined) initialVal = isDeg(key)
          ? +(`${item[key]}`.replace(/[^0-9]/ig,''))
          : item[key]
      })
      // console.info(`getInitialVal transform.${key}=${initialVal}`)
      return initialVal
    }
    const val = originalStyle[key] === undefined ? InitialValue[key] : originalStyle[key]
    if (key === 'transformOrigin' && typeof val === 'string') {
      return val.split(' ')
    }
    return val
  }
  // 循环 animation actions 获取所有有动画的 style prop name
  function getAnimatedStyleKeys() {
    const actions = animation?.actions || []
    // const arr =[...new Set([].concat(...actions.map(({ rules, transform }) => [
    //       ...rules.keys(),
    //       ...transform.keys()
    //     ])))]
    // console.info('getAnimatedStyleKeys, arr=', arr)
    return [...new Set([].concat(...actions.map(({ rules, transform }) => [
      'transformOrigin',
      ...rules.keys(),
      ...transform.keys()
    ])))]
  }
  // animated key transform 格式化
  function formatAnimatedKeys(keys=[]) {
    const animatedKeys = []
    const transforms = []
    keys.forEach(key => {
      if (isTransform(key)) {
        transforms.push(key)
      } else {
        animatedKeys.push(key)
      }
    })
    if (transforms.length) animatedKeys.push(['transform', transforms])
    return animatedKeys
  }
  // transform 数组转对象
  function getTransformObj () {
    'worklet'
    const transforms = originalStyle.transform || []
    return transforms.reduce(( transformObj, item )=> {
      return Object.assign(transformObj, item)
    }, {})
  }
  // 生成动画样式
  return useAnimatedStyle(() => {
    // console.info(`useAnimatedStyle styles=`, originalStyle)
    return animatedStyleKeys.value.reduce((styles, key) => {
      // console.info('getAnimationStyles', key, shareValMap[key].value)
      if (Array.isArray(key)) {
        const [,transformKeys] = key
        const transformStyle = getTransformObj()
        transformKeys.forEach(transformKey => {
          transformStyle[transformKey] = shareValMap[transformKey].value
        })
        styles['transform'] = Object.entries(transformStyle).map(([key, value]) => {
          return { [key]: value }
        })
      } else {
        styles[key] = shareValMap[key].value
      }
      return styles
    }, Object.assign({}, originalStyle) as ViewStyle)
  })
}
