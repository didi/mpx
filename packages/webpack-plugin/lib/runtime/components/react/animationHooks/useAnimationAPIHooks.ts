import { useMemo } from 'react'
import {
  Easing,
  withSequence,
  makeMutable,
  runOnJS,
  useSharedValue
} from 'react-native-reanimated'
import {
  EasingKey,
  TransformOrigin,
  InitialValue,
  PropNameColorExp,
  isTransform,
  getInitialVal,
  getAnimation
} from './utils'
import type { AnimationCallback, SharedValue, AnimatableValue } from 'react-native-reanimated'
import type { ExtendedViewStyle } from '../types/common'
import type { _ViewProps } from '../mpx-view'
import type { CustomAnimationCallback, InterpolateOutput } from './utils'

export default function useAnimationAPIHooks<T, P> (props: _ViewProps & { transitionend?: CustomAnimationCallback }) {
  // console.log(`useAnimationAPIHooks, props=`, props)
  const { style: originalStyle = {}, animation, transitionend } = props
  // ** 全量 style prop sharedValue
  const shareValMap = useMemo(() => {
    return Object.keys(InitialValue).reduce((valMap, key) => {
      const defaultVal = getInitialVal(originalStyle, key)
      valMap[key] = makeMutable(PropNameColorExp.test(key) ? 0 : defaultVal)
      return valMap
    }, {} as { [propName: keyof ExtendedViewStyle]: SharedValue<string|number> })
  }, [])
  const colorOutput = useMemo(() => {
    return Object.keys(InitialValue).reduce((output, property) => {
      if (PropNameColorExp.test(property)) {
        const defaultVal = getInitialVal(originalStyle, property)
        output[property] = [defaultVal, 'transparent']
      }
      return output
    }, {} as InterpolateOutput)
  }, [])
  // 颜色插值
  const interpolateOutput = useSharedValue(colorOutput)
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
          transitionend && runOnJS(transitionend)(finished, current, duration)
        }
      }
      if (index === 0) {
        // 设置当次中心
        transformOrigin && (shareValMap[TransformOrigin].value = transformOrigin)
      }
      // 添加每个key的多次step动画
      animatedKeys.forEach(key => {
        const ruleV = isTransform(key) ? transform.get(key) : rules.get(key)
        if (PropNameColorExp.test(key)) {
          const val = interpolateOutput.value
          val[key][1] = (ruleV || 'transparent') as string
          // fixme 这里直接改 interpolateOutput.value[key][1] 不会触发ui层更新，需通过 interpolateOutput.value = obj 触发一下
          interpolateOutput.value = val
        }
        // color 设置为 1
        // key不存在，第一轮取shareValMap[key]value，非第一轮取上一轮的
        const toVal = PropNameColorExp.test(key)
          ? 1
          : ruleV !== undefined
            ? ruleV
            : index > 0
              ? lastValueMap[key]
              : shareValMap[key].value
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
    interpolateOutput,
    createAnimation,
    getAnimatedStyleKeys
  }
}
