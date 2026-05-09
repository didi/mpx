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
  animationAPIInitialValue,
  percentExp,
  isTransform,
  getInitialVal,
  getAnimation,
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
  // animation API 使用 animation.id 为依赖
  if (animation?.id) {
    animationDeps.current = animation.id
  }
  // 有动画样式的 style key(useAnimatedStyle使用)
  const animatedStyleKeys = useSharedValue([] as (string|string[])[])
  // 记录需要执行动画的 propName
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
      let value = originalStyle[key]
      if (isTransform(key)) {
        value = originalStyle.transform
        Object.entries(getTransformObj(value)).forEach(([key, value]) => {
          if (value !== lastStyleRef.current[key]) {
            lastStyleRef.current[key] = value
            shareValMap[key].value = value
          }
        })
      } else {
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
            transformOrigin && (shareValMap.transformOrigin.value = transformOrigin)
          }
          transitionend && runOnJS(runOnJSCallback)('transitionend', finished, current, duration)
        }
      }
      if (index === 0 && transformOrigin) {
        // 设置当次中心
        shareValMap.transformOrigin.value = transformOrigin
      }
      // 添加每个key的多次step动画
      animatedKeys.forEach(key => {
        const shareVal = shareValMap[key].value
        const ruleV = isTransform(key) ? transform.get(key) : rules.get(key)
        // color 设置为 1
        // key不存在，第一轮取shareValMap[key]value，非第一轮取上一轮的
        let toVal = ruleV !== undefined
          ? ruleV
          : index > 0
            ? lastValueMap[key]
            : shareVal
        if (percentExp.test(`${toVal}`) && !percentExp.test(shareVal as string) && !isNaN(+shareVal)) {
          // 获取到的toVal为百分比格式化shareValMap为百分比
          shareValMap[key].value = `${shareVal as number * 100}%`
        } else if (percentExp.test(shareVal as string) && !percentExp.test(toVal as string) && !isNaN(+toVal)) {
          // 初始值为百分比则格式化toVal为百分比
          toVal = `${toVal as number * 100}%`
        } else if (typeof toVal !== typeof shareVal) {
          // 动画起始值和终态值类型不一致报错提示一下
          error(`[Mpx runtime error]: Value types of property ${key} must be consistent during the animation`)
        }
        const animation = (toVal === 'auto' && !isNaN(+shareVal)) || (shareVal === 'auto' && !isNaN(+toVal)) ? toVal : getAnimation({ key, value: toVal! }, { delay, duration, easing }, needSetCallback ? callback : undefined)
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
    animatedStyleKeys.value = formatAnimatedKeys(['transformOrigin', ...animatedKeys.current])
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
