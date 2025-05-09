import { hasOwn } from '@mpxjs/utils'

import { useEffect, useMemo, useRef } from 'react'
import { TransformsStyle } from 'react-native'
import {
  Easing,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withSequence,
  withDelay,
  makeMutable,
  cancelAnimation,
  runOnJS
} from 'react-native-reanimated'
import {
  EasingKey, Transform, TransformOrigin, InitialValue,
  isTransform, getTransformObj
} from './utils'
import type { ExtendedViewStyle } from '../types/common'
import type { _ViewProps } from '../mpx-view'
import type { AnimationCallback, SharedValue } from 'react-native-reanimated'
import type { ExtendWithTimingConfig } from './utils'

export default function useAnimationAPIHooks<T, P> (props: _ViewProps) {
  const { style = {}, animation, bindtransitionend } = props
  // 有动画样式的 style key
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animatedStyleKeys = useSharedValue([] as (string|string[])[])
  // 记录动画key的style样式值 没有的话设置为false
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animatedKeys = useRef({} as {[propName: keyof ExtendedViewStyle]: boolean})
  // 记录上次style map
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const lastStyleRef = useRef({} as {[propName: keyof ExtendedViewStyle]: number|string})
  // ** 全量 style prop sharedValue
  // 不能做增量的原因：
  // 1 尝试用 useRef，但 useAnimatedStyle 访问后的 ref 不能在增加新的值，被冻结
  // 2 尝试用 useSharedValue，因为实际触发的 style prop 需要是 sharedValue 才能驱动动画，若外层 shareValMap 也是 sharedValue，动画无法驱动。
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const shareValMap = useMemo(() => {
    return Object.keys(InitialValue).reduce((valMap, key) => {
      const defaultVal = getInitialVal(key, isTransform(key))
      valMap[key] = makeMutable(defaultVal)
      return valMap
    }, {} as { [propName: keyof ExtendedViewStyle]: SharedValue<string|number> })
  }, [])
  // ** style更新同步
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // style 更新后同步更新 lastStyleRef & shareValMap
    updateStyleVal()
  }, [style])
  // ** 获取动画样式prop & 驱动动画
  // id 标识
  const id = animation?.id || -1
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (id === -1) return
    // 更新动画样式 key map
    animatedKeys.current = getAnimatedStyleKeys()
    const keys = Object.keys(animatedKeys.current)
    animatedStyleKeys.value = formatAnimatedKeys([TransformOrigin, ...keys])
    // 驱动动画
    createAnimation(keys)
  }, [id])
  // ** 清空动画
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    return () => {
      Object.values(shareValMap).forEach((value) => {
        cancelAnimation(value)
      })
    }
  }, [])
  // 根据 animation action 创建&驱动动画
  function createAnimation (animatedKeys: string[] = []) {
    const actions = animation?.actions || []
    const sequence = {} as { [propName: keyof ExtendedViewStyle]: (string|number)[] }
    const lastValueMap = {} as { [propName: keyof ExtendedViewStyle]: string|number }
    actions.forEach(({ animatedOption, rules, transform }, index) => {
      const { delay, duration, timingFunction, transformOrigin } = animatedOption
      const easing = EasingKey[timingFunction] || Easing.inOut(Easing.quad)
      let needSetCallback = true
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
      if (index === 0) {
        // 设置当次中心
        shareValMap[TransformOrigin].value = transformOrigin
      }
      // 添加每个key的多次step动画
      animatedKeys.forEach(key => {
        const ruleV = isTransform(key) ? transform.get(key) : rules.get(key)
        // key不存在，第一轮取shareValMap[key]value，非第一轮取上一轮的
        const toVal = ruleV !== undefined
          ? ruleV
          : index > 0
            ? lastValueMap[key]
            : shareValMap[key].value
        const animation = getAnimation({ key, value: toVal! }, { delay, duration, easing }, needSetCallback ? setTransformOrigin : undefined)
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
  // 创建单个animation
  function getAnimation ({ key, value }: { key: string, value: string|number }, { delay, duration, easing }: ExtendWithTimingConfig, callback?: AnimationCallback) {
    const animation = typeof callback === 'function'
      ? withTiming(value, { duration, easing }, (finished, current) => {
        callback(finished, current)
        if (finished && bindtransitionend) {
          runOnJS(bindtransitionend)(finished, current, duration)
        }
      })
      : withTiming(value, { duration, easing })
    return delay ? withDelay(delay, animation) : animation
  }
  // 获取样式初始值（prop style or 默认值）
  function getInitialVal (key: keyof ExtendedViewStyle, isTransform = false) {
    if (isTransform && Array.isArray(style.transform)) {
      let initialVal = InitialValue[key]
      // 仅支持 { transform: [{rotateX: '45deg'}, {rotateZ: '0.785398rad'}] } 格式的初始样式
      style.transform.forEach(item => {
        if (item[key] !== undefined) initialVal = item[key]
      })
      return initialVal
    }
    return style[key] === undefined ? InitialValue[key] : style[key]
  }
  // 循环 animation actions 获取所有有动画的 style prop name
  function getAnimatedStyleKeys () {
    return (animation?.actions || []).reduce((keyMap, action) => {
      const { rules, transform } = action
      const ruleArr = [...rules.keys(), ...transform.keys()]
      ruleArr.forEach(key => {
        if (!keyMap[key]) keyMap[key] = true
      })
      return keyMap
    }, animatedKeys.current)
  }
  // animated key transform 格式化
  function formatAnimatedKeys (keys: string[]) {
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
  // 设置 lastShareValRef & shareValMap
  function updateStyleVal () {
    Object.entries(style).forEach(([key, value]) => {
      if (key === Transform) {
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
  // ** 生成动画样式
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animationStyle = useAnimatedStyle(() => {
    // console.info(`useAnimatedStyle styles=`, originalStyle)
    return animatedStyleKeys.value.reduce((styles, key) => {
      // console.info('getAnimationStyles', key, shareValMap[key].value)
      if (Array.isArray(key)) {
        const transformStyle = getTransformObj(style.transform || [])
        key.forEach((transformKey) => {
          transformStyle[transformKey] = shareValMap[transformKey].value
        })
        styles.transform = Object.entries(transformStyle).map(([key, value]) => {
          return { [key]: value }
        }) as Extract<'transform', TransformsStyle>
      } else {
        styles[key] = shareValMap[key].value
      }
      return styles
    }, {} as ExtendedViewStyle)
  })
  return animationStyle
}
