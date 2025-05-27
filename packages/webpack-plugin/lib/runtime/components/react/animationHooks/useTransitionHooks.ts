import { hasOwn, dash2hump } from '@mpxjs/utils'
import { useEffect, useMemo, useRef } from 'react'
import {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  makeMutable,
  runOnJS,
  cancelAnimation
} from 'react-native-reanimated'
import {
  EasingKey,
  Transform,
  TransformOrigin,
  SupportedProperty,
  TransformInitial,
  getTransformObj,
  getUnit,
  parseValues,
  getInitialVal,
  formatAnimatedKeys,
  getAnimation,
  isTransform
} from './utils'
import type { TransformsStyle } from 'react-native'
import type { AnimationCallback, SharedValue, AnimatableValue } from 'react-native-reanimated'
import type { ExtendedViewStyle } from '../types/common'
import type { _ViewProps } from '../mpx-view'
import type { CustomAnimationCallback, TransitionMap, TimingFunction, AnimatedOption } from './utils'

// transition 解析相关方法
// 解析 property timingFunction
function parseTransition (transition: string) {
  const options = parseValues(transition)
  console.log('parseSingleTransition options=', options)
  if (options.length < 2) return undefined
  const property = options[0]
  const duration = getUnit(options[1])
  console.log('parseSingleTransition duration=', property, duration)
  if (!property || !duration) return undefined
  const timingFunction = (Object.keys(EasingKey).includes(options[2]) ? options[2] : 'linear') as TimingFunction
  const delay = getUnit(options[2]) || getUnit(options[3])
  console.log(`parseSingleTransition property=${property} duration=${duration} delay: ${delay} timingFunction: ${timingFunction}`)
  return {
    property: dash2hump(property),
    animatedOption: {
      duration,
      timingFunction,
      delay
    }
  }
}
// transition 解析
function parseTransitionStyle (originalStyle: ExtendedViewStyle) {
  const transition = originalStyle.transition
  if (transition) {
    // Todo 末尾分号;
    const isMulti = transition.includes(',')
    if (isMulti) {
      const multi = parseValues(transition, ',')
      // ["transform 3s ease", "color 1s"]
      // console.log('parseTransition multi=', multi)
      return multi.reduce((transitionMap, item) => {
        const { property = '', animatedOption = undefined } = parseTransition(item) || {}
        console.log(item, property, animatedOption)
        if (property && (hasOwn(SupportedProperty, property) || property === Transform)) {
          transitionMap[property] = animatedOption!
        }
        return transitionMap
      }, {} as TransitionMap)
    } else {
      const { property, animatedOption } = parseTransition(transition) || {}
      return property && (hasOwn(SupportedProperty, property) || property === Transform)
        ? {
            [property]: animatedOption
          }
        : null
    }
  } else if (originalStyle.transitionProperty && originalStyle.transitionDuration) {
    return parseTransitionProp(originalStyle)
  }
  return null
}
function parseTransitionProp (originalStyle: ExtendedViewStyle) {
  console.log(`transitionProperty=${originalStyle.transitionProperty} transitionDuration=${originalStyle.transitionDuration}`)
  // Todo transition-behavior
  const properties = parseValues(originalStyle.transitionProperty, ',')
  const durations = parseValues(originalStyle.transitionDuration, ',')
  const timingFunction = parseValues(originalStyle.transitionTimingFunction, ',')
  const delays = parseValues(originalStyle.transitionDelay, ',')
  if (properties.length === 1) {
    const property = properties[0]
    return {
      [property]: {
        duration: durations[0],
        timingFunction: timingFunction[0] || 'linear',
        delay: delays[0] || 0
      }
    }
  } else if (properties.length > 1) {
    return properties.reduce((transitionMap, property, idx) => {
      transitionMap[property] = {
        duration: +(durations[idx] ? durations[idx] : durations[0]),
        timingFunction: (timingFunction[idx] ? timingFunction[idx] : timingFunction[0] || 'linear') as TimingFunction,
        delay: +(delays[idx] ? delays[idx] : delays[0] || 0)
      }
      return transitionMap
    }, {} as TransitionMap)
  }
  return null
}
export default function useTransitionHooks<T, P> (props: _ViewProps & { transitionend?: CustomAnimationCallback }) {
  const { style: originalStyle = {}, transitionend } = props
  // 有动画样式的 style key // ["transformOrigin", "marginLeft", ["translateY"]]
  const animatedStyleKeys = useSharedValue([] as (string|string[])[])
  // 记录上次style map
  // const lastStyleRef = useRef({} as {[propName: keyof ExtendedViewStyle]: number|string})
  // 记录有动画的 propName // {"marginLeft": true, "translateY": true}
  const animatedKeys = useRef({} as {[propName: keyof ExtendedViewStyle]: boolean})
  // ** 从 style 中获取动画数据
  const transitionMap = useMemo(() => {
    return (parseTransitionStyle(originalStyle) || {}) as TransitionMap
  }, [])
  console.log('transitionMap=', transitionMap)
  // ** style prop sharedValue
  const shareValMap = useMemo(() => {
    return Object.keys(transitionMap).reduce((valMap, property) => {
      // const { property } = transition || {}
      if (property === Transform) {
        Object.keys(originalStyle.transform ? getTransformObj(originalStyle.transform!) : TransformInitial).forEach((key) => {
          const defaultVal = getInitialVal(originalStyle, key)
          console.log(`shareValMap property=${key} defaultVal=${defaultVal}`)
          valMap[key] = makeMutable(defaultVal)
        })
      } else if (hasOwn(SupportedProperty, property)) {
        const defaultVal = getInitialVal(originalStyle, property)
        console.log(`shareValMap property=${property} defaultVal=${defaultVal}`)
        valMap[property] = makeMutable(defaultVal)
      }
      // console.log('shareValMap = ', valMap)
      return valMap
    }, {} as { [propName: keyof ExtendedViewStyle]: SharedValue<string|number> })
  }, [])
  // ** 驱动动画
  useEffect(() => {
    animatedKeys.current = getAnimatedKeysFromTransition()
    console.log('animatedKeys=', animatedKeys.current)
    startAnimation()
  })
  // ** 清空动画
  useEffect(() => {
    return () => {
      Object.values(shareValMap).forEach((value) => {
        cancelAnimation(value)
      })
    }
  }, [])
  // 开始动画
  function startAnimation () {
    const keys = Object.keys(animatedKeys.current)
    console.log('animatedKeys=', keys)
    animatedStyleKeys.value = formatAnimatedKeys([TransformOrigin, ...keys])
    console.log('animatedStyleKeys=', animatedStyleKeys.value)
    // 驱动动画
    createAnimation(keys)
  }
  // 根据 animation action 创建&驱动动画
  function createAnimation (animatedKeys: string[] = []) {
    let needSetCallback = !!transitionend
    animatedKeys.forEach(key => {
      console.log(`createAnimation key=${key} originalStyle=`, originalStyle)
      let ruleV = originalStyle[key]
      if (isTransform(key)) {
        const transform = getTransformObj(originalStyle.transform!)
        ruleV = transform[key]
      }
      console.log('ruleV=', key, ruleV)
      const toVal = ruleV !== undefined
        ? ruleV
        : shareValMap[key].value
      const { delay = 0, duration, timingFunction } = transitionMap[isTransform(key) ? Transform : key]
      // ease 兜底
      const easing = EasingKey[timingFunction as TimingFunction] || Easing.inOut(Easing.ease)
      console.log('animationOptions=', { delay, duration, timingFunction })
      const callback: AnimationCallback = (finished?: boolean, current?: AnimatableValue) => {
        'worklet'
        // 动画结束后设置下一次transformOrigin
        if (finished && transitionend) {
          runOnJS(transitionend)(finished, current, duration)
        }
      }
      const animation = getAnimation({ key, value: toVal! }, { delay, duration, easing }, needSetCallback ? callback : undefined)
      needSetCallback = false
      shareValMap[key].value = animation
    })
  }
  // 从 transition 获取 AnimatedKeys
  function getAnimatedKeysFromTransition () {
    return Object.entries(originalStyle).reduce((animatedKeys, [key, value]) => {
      // console.log('getAnimatedKeysFromTransition init', key, value)
      if (hasOwn(transitionMap, Transform) && key === Transform) {
        Object.keys(getTransformObj(value)).forEach((prop: string) => {
          animatedKeys[prop] = true
        })
      } else if (hasOwn(transitionMap, key)) {
        animatedKeys[key] = true
      }
      return animatedKeys
    }, animatedKeys.current)
  }
  // ** 生成动画样式
  const animationStyle = useAnimatedStyle(() => {
    // console.info(`useAnimatedStyle styles=`, originalStyle)
    return animatedStyleKeys.value.reduce((styles, key) => {
      // console.info('getAnimationStyles', key, shareValMap[key].value)
      if (Array.isArray(key)) {
        const transformStyle = getTransformObj(originalStyle.transform || [])
        key.forEach((transformKey) => {
          transformStyle[transformKey] = shareValMap[transformKey].value
        })
        styles.transform = Object.entries(transformStyle).map(([key, value]) => {
          return { [key]: value }
        }) as Extract<'transform', TransformsStyle>
      } else if (shareValMap[key]) {
        styles[key] = shareValMap[key].value
      }
      return styles
    }, {} as ExtendedViewStyle)
  })
  return animationStyle
}
