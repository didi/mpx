import { useMemo, useRef, useEffect } from 'react'
import { error, hasOwn } from '@mpxjs/utils'
import {
  Easing,
  withSequence,
  makeMutable,
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  cancelAnimation
} from 'react-native-reanimated'
import {
  easingKey,
  transformOrigin as TransformOrigin,
  animationAPIInitialValue,
  percentExp,
  isTransform,
  getInitialVal,
  getAnimation,
  transition,
  transform,
  getTransformObj,
  formatAnimatedKeys
} from './utils'
import { useRunOnJSCallback } from '../utils'
import type { NativeSyntheticEvent, TransformsStyle } from 'react-native'
import type { AnimationCallback, SharedValue, AnimatableValue } from 'react-native-reanimated'
import type { ExtendedViewStyle } from '../types/common'
import type { AnimationHooksPropsType } from './utils'

export default function useAnimationAPIHooks<T, P> (props: AnimationHooksPropsType) {
  // console.log(`useAnimationAPIHooks, props=`, props)
  const { style: originalStyle = {}, animation, transitionend } = props
  // style变更标识(首次render不执行)
  const animationDeps = useRef(-1)
  // 若为 animation API，则使用 animation.id 为依赖
  if (animation?.id) {
    animationDeps.current = animation.id
  }
  // 有动画样式的 style key(useAnimatedStyle使用)
  const animatedStyleKeys = useSharedValue([] as (string|string[])[])
  // 记录动画key的style样式值 没有的话设置为false
  const animatedKeys = useRef([] as string[])
  // 记录上次style map
  const lastStyleRef = useRef({} as {[propName: keyof ExtendedViewStyle]: number|string})
  // ** 全量 style prop sharedValue
  const shareValMap = useMemo(() => {
    return Object.keys(animationAPIInitialValue).reduce((valMap, key) => {
      const defaultVal = getInitialVal(originalStyle, key)
      valMap[key] = makeMutable(defaultVal)
      return valMap
    }, {} as { [propName: keyof ExtendedViewStyle]: SharedValue<string|number> })
  }, [])
  const runOnJSCallbackRef = useRef({})
  if (transitionend) {
    runOnJSCallbackRef.current = {
      transitionend
    }
  }
  const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef)
  // 设置 lastShareValRef & shareValMap
  function updateStyleVal () {
    Object.keys(shareValMap).forEach(key => {
      const value = originalStyle[key]
      if (key === transform) {
        Object.entries(getTransformObj(value)).forEach(([key, value]) => {
          if (value !== lastStyleRef.current[key]) {
            lastStyleRef.current[key] = value
            shareValMap[key].value = value
          }
        })
      } else if (hasOwn(shareValMap, key)) {
        if (value !== lastStyleRef.current[key]) {
          lastStyleRef.current[key] = value
          shareValMap[key].value = value
        }
      }
    })
  }
  // 根据 animation action 创建&驱动动画
  function createAnimation (animatedKeys: string[] = []) {
    const actions = animation?.actions || []
    const sequence = {} as { [propName: keyof ExtendedViewStyle]: (string|number)[] }
    const lastValueMap = {} as { [propName: keyof ExtendedViewStyle]: string|number }
    actions.forEach(({ animatedOption, rules, transform }, index) => {
      const { delay, duration, timingFunction, transformOrigin } = animatedOption
      const easing = timingFunction ? easingKey[timingFunction] : Easing.inOut(Easing.quad)
      let needSetCallback = true
      const callback: AnimationCallback = (finished?: boolean, current?: AnimatableValue) => {
        'worklet'
        // 动画结束后设置下一次transformOrigin
        if (finished) {
          if (index < actions.length - 1) {
            const transformOrigin = actions[index + 1].animatedOption?.transformOrigin
            transformOrigin && (shareValMap[TransformOrigin].value = transformOrigin)
          }
          transitionend && runOnJS(runOnJSCallback)('transitionend', duration, finished, current)
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
          error(`[Mpx runtime error]: Value types of property ${key} must be consistent during the animation`)
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
  function getAnimatedStyleKeys () {
    return (animation?.actions || []).reduce((keyMap, action) => {
      const { rules, transform } = action
      const ruleArr = [...rules.keys(), ...transform.keys()]
      ruleArr.forEach(key => {
        keyMap.push(key)
      })
      // console.log('getAnimatedStyleKeys keyMap=', keyMap)
      return keyMap
    }, [] as string[])
  }
  // 获取动画样式&驱动动画
  function startAnimation () {
    // 更新动画样式 key map
    animatedKeys.current = getAnimatedStyleKeys()
    animatedStyleKeys.value = formatAnimatedKeys([TransformOrigin, ...animatedKeys.current])
    // 驱动动画
    createAnimation(animatedKeys.current)
  }
  // ** style 更新
  useEffect(() => {
    // animation api style 更新同步更新 shareVal（默认）
    updateStyleVal()
  }, [originalStyle])
  // ** 获取动画样式prop & 驱动动画
  useEffect(() => {
    if (animationDeps.current <= 0) return
    startAnimation()
  }, [animationDeps.current])
  // ** 清空动画
  useEffect(() => {
    return () => {
      Object.values(shareValMap).forEach((value) => {
        cancelAnimation(value)
      })
    }
  }, [])
  // ** 生成动画样式
  return useAnimatedStyle(() => {
    // console.info(`useAnimatedStyle styles=`, originalStyle)
    return animatedStyleKeys.value.reduce((styles, key) => {
      if (Array.isArray(key)) {
        const transformStyle = getTransformObj(originalStyle.transform || [])
        key.forEach((transformKey) => {
          transformStyle[transformKey] = shareValMap[transformKey].value
        })
        styles.transform = Object.entries(transformStyle).map(([key, value]) => {
          return { [key]: value }
        }) as Extract<'transform', TransformsStyle>
      } else {
        styles[key] = shareValMap[key].value
      }
      // console.log('animationStyle', styles)
      return styles
    }, {} as ExtendedViewStyle)
  })
}
