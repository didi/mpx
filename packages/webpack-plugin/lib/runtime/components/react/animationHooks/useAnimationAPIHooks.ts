import { useMemo, useRef } from 'react'
import { error } from '@mpxjs/utils'
import {
  Easing,
  withSequence,
  makeMutable,
  runOnJS
} from 'react-native-reanimated'
import {
  EasingKey,
  TransformOrigin,
  animationAPIInitialValue,
  percentExp,
  isTransform,
  getInitialVal,
  getAnimation
} from './utils'
import { useRunOnJSCallback } from '../utils'
import type { AnimationCallback, SharedValue, AnimatableValue } from 'react-native-reanimated'
import type { ExtendedViewStyle } from '../types/common'
import type { AnimationHooksPropsType } from './utils'

export default function useAnimationAPIHooks<T, P> (props: AnimationHooksPropsType) {
  // console.log(`useAnimationAPIHooks, props=`, props)
  const { style: originalStyle = {}, animation, transitionend } = props
  const propsRef = useRef<AnimationHooksPropsType>({})
  propsRef.current = props
  const transitionendRunJS = (duration: number, finished?: boolean, current?: AnimatableValue) => {
    const { transitionend } = propsRef.current
    transitionend && transitionend(finished, current, duration)
  }
  const runOnJSCallbackRef = useRef({
    transitionendRunJS
  })
  const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef)
  // ** 全量 style prop sharedValue
  const shareValMap = useMemo(() => {
    return Object.keys(animationAPIInitialValue).reduce((valMap, key) => {
      const defaultVal = getInitialVal(originalStyle, key)
      valMap[key] = makeMutable(defaultVal)
      return valMap
    }, {} as { [propName: keyof ExtendedViewStyle]: SharedValue<string|number> })
  }, [])
  // 根据 animation action 创建&驱动动画
  function createAnimation (animatedKeys: string[] = []) {
    const actions = animation?.actions || []
    const sequence = {} as { [propName: keyof ExtendedViewStyle]: (string|number)[] }
    const lastValueMap = {} as { [propName: keyof ExtendedViewStyle]: string|number }
    actions.forEach(({ animatedOption, rules, transform }, index) => {
      const { delay, duration, timingFunction, transformOrigin } = animatedOption
      const easing = timingFunction ? EasingKey[timingFunction] : Easing.inOut(Easing.quad)
      let needSetCallback = true
      const callback: AnimationCallback = (finished?: boolean, current?: AnimatableValue) => {
        'worklet'
        // 动画结束后设置下一次transformOrigin
        if (finished) {
          if (index < actions.length - 1) {
            const transformOrigin = actions[index + 1].animatedOption?.transformOrigin
            transformOrigin && (shareValMap[TransformOrigin].value = transformOrigin)
          }
          transitionend && runOnJS(runOnJSCallback)('transitionendRunJS', duration, finished, current)
        }
      }
      if (index === 0) {
        // 设置当次中心
        transformOrigin && (shareValMap[TransformOrigin].value = transformOrigin)
      }
      // 添加每个key的多次step动画
      animatedKeys.forEach(key => {
        const ruleV = isTransform(key) ? transform.get(key) : rules.get(key)
        // color 设置为 1
        // key不存在，第一轮取shareValMap[key]value，非第一轮取上一轮的
        let toVal = ruleV !== undefined
          ? ruleV
          : index > 0
            ? lastValueMap[key]
            : shareValMap[key].value
        if (percentExp.test(`${toVal}`) && typeof +shareValMap[key].value === 'number') {
          shareValMap[key].value = `${shareValMap[key].value as number * 100}%`
        } else if (percentExp.test(shareValMap[key].value as string) && typeof +toVal === 'number') {
          // 初始值为百分比则格式化toVal为百分比
          toVal = `${toVal as number * 100}%`
        } else if (typeof toVal !== typeof shareValMap[key].value) {
          // transition动画起始值和终态值类型不一致报错提示一下
          error(`[Mpx runtime error]: Value types of property ${key} must be consistent during the animation`);
        }
        // Todo 对齐wx
        const animation = getAnimation({ key, value: toVal! }, { delay, duration, easing }, needSetCallback ? callback : undefined)
        needSetCallback = false
        if (!sequence[key]) {
          sequence[key] = [animation]
        } else {
          sequence[key].push(animation)
        }
        // 更新一下 lastValueMap
        lastValueMap[key] = toVal!
      })
      // 赋值驱动动画
      animatedKeys.forEach((key) => {
        const animations = sequence[key]
        shareValMap[key].value = animations.length > 1 ? withSequence(...animations) : animations[0]
      })
    })
  }
  // 循环 animation actions 获取所有有动画的 style prop name
  function getAnimatedStyleKeys (animatedKeys: {[propName: keyof ExtendedViewStyle]: boolean}) {
    return (animation?.actions || []).reduce((keyMap, action) => {
      const { rules, transform } = action
      const ruleArr = [...rules.keys(), ...transform.keys()]
      ruleArr.forEach(key => {
        if (!keyMap[key]) keyMap[key] = true
      })
      // console.log('getAnimatedStyleKeys keyMap=', keyMap)
      return keyMap
    }, animatedKeys)
  }
  return {
    shareValMap,
    createAnimation,
    getAnimatedStyleKeys
  }
}
