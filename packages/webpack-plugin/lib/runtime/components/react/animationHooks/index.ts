import { error, collectDataset, hasOwn } from '@mpxjs/utils'
import { useEffect, useRef } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  cancelAnimation
} from 'react-native-reanimated'
import {
  Transition,
  Transform,
  TransformOrigin,
  getTransformObj,
  formatAnimatedKeys
} from './utils'
import useAnimationAPIHooks from './useAnimationAPIHooks'
import useTransitionHooks from './useTransitionHooks'
import type { AnimatableValue } from 'react-native-reanimated'
import type { MutableRefObject } from 'react'
import type { NativeSyntheticEvent, TransformsStyle } from 'react-native'
import type { _ViewProps } from '../mpx-view'
import type { ExtendedViewStyle } from '../types/common'

// 动画类型
export const enum AnimationType {
  // 兜底
  None,
  API,
  CssTransition,
  CssAnimation
}

export default function useAnimationHooks<T, P> (props: _ViewProps & { enableAnimation?: boolean | AnimationType, layoutRef: MutableRefObject<any>, transitionend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void }) {
  const { style: originalStyle = {}, enableAnimation, animation, transitionend, layoutRef } = props
  // 记录动画类型 优先级 css transition > css animation > API
  let animationType = AnimationType.None
  const propNames = Object.keys(originalStyle)
  if (propNames.find(item => item.includes(Transition))) {
    animationType = AnimationType.CssTransition
  }
  if (propNames.find(item => item.includes('animation'))) {
    animationType = AnimationType.CssAnimation
  }
  if (!!animation || enableAnimation === true) {
    animationType = AnimationType.API
  }
  if (enableAnimation === AnimationType.API || enableAnimation === AnimationType.CssTransition || enableAnimation === AnimationType.CssAnimation) {
    animationType = enableAnimation
  }
  const animationTypeRef = useRef(animationType)
  if (animationType && animationTypeRef.current !== animationType) {
    // 允许 none到API、CssTransition或API、CssTransition到none，不允许 API、CssTransition 互切
    error('[Mpx runtime error]: The animation type should be stable in the component lifecycle, or you can set animation type with [enable-animation].')
  }
  if (animationTypeRef.current === AnimationType.CssAnimation) {
    // 暂不支持 CssAnimation 提示
    error('[Mpx runtime error]: CSS animation is not supported yet')
    return { enableStyleAnimation: false }
  }
  if (!animationTypeRef.current) return { enableStyleAnimation: false }
  // style变更标识(首次render不执行)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animationDeps = useRef(-1)
  // 若为 animation API，则使用 animation.id 为依赖
  if (animation?.id) {
    animationDeps.current = animation.id
  }
  // 有动画样式的 style key(useAnimatedStyle使用)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animatedStyleKeys = useSharedValue([] as (string|string[])[])
  // 记录动画key的style样式值 没有的话设置为false
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animatedKeys = useRef({} as {[propName: keyof ExtendedViewStyle]: boolean})
  // 记录上次style map
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const lastStyleRef = useRef({} as {[propName: keyof ExtendedViewStyle]: number|string})
  // 设置 lastShareValRef & shareValMap
  function updateStyleVal (isDeps = false) {
    Object.entries(originalStyle).forEach(([key, value]) => {
      if (key === Transform) {
        Object.entries(getTransformObj(value)).forEach(([key, value]) => {
          if (value !== lastStyleRef.current[key]) {
            if (!isDeps) {
              lastStyleRef.current[key] = value
              shareValMap[key].value = value
            } else {
              animationDeps.current += 1
            }
          }
        })
      } else if (hasOwn(shareValMap, key)) {
        if (value !== lastStyleRef.current[key]) {
          if (!isDeps) {
            lastStyleRef.current[key] = value
            shareValMap[key].value = value
          } else {
            animationDeps.current += 1
          }
        }
      }
    })
  }
  function withTimingCallback (finished?: boolean, current?: AnimatableValue, duration?: number) {
    const target = {
      id: animation?.id || -1,
      dataset: collectDataset(props),
      offsetLeft: layoutRef?.current?.offsetLeft || 0,
      offsetTop: layoutRef?.current?.offsetTop || 0
    }
    transitionend!({
      type: 'transitionend',
      // elapsedTime 对齐wx 单位s
      detail: { elapsedTime: duration ? duration / 1000 : 0, finished, current },
      target,
      currentTarget: target,
      timeStamp: Date.now()
    })
  }

  const {
    shareValMap,
    getAnimatedStyleKeys,
    createAnimation
  } = animationTypeRef.current === AnimationType.API
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ? useAnimationAPIHooks({
      animation,
      style: originalStyle,
      transitionend: transitionend && withTimingCallback
    })
    // eslint-disable-next-line react-hooks/rules-of-hooks
    : useTransitionHooks({
      style: originalStyle,
      transitionend: transitionend && withTimingCallback
    })
  // 获取动画样式&驱动动画
  function startAnimation () {
    // 更新动画样式 key map
    animatedKeys.current = getAnimatedStyleKeys(animatedKeys.current)
    const keys = Object.keys(animatedKeys.current)
    animatedStyleKeys.value = formatAnimatedKeys(animationTypeRef.current === AnimationType.API ? [TransformOrigin, ...keys] : keys)
    // 驱动动画
    createAnimation(keys)
  }
  // ** style 更新
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // animation api style 更新同步更新 shareVal（默认）
    // css transition 更新 animationDeps
    updateStyleVal(animationTypeRef.current === AnimationType.CssTransition)
  }, [originalStyle])
  // ** 获取动画样式prop & 驱动动画
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // console.log('useEffect animationDeps=', animationDeps.current)
    if (animationDeps.current <= 0) return
    startAnimation()
  }, [animationDeps.current])
  // ** 清空动画
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    return () => {
      Object.values(shareValMap).forEach((value) => {
        cancelAnimation(value)
      })
    }
  }, [])
  // ** 生成动画样式
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animationStyle = useAnimatedStyle(() => {
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

  return {
    enableStyleAnimation: !!animationTypeRef.current,
    animationStyle
  }
}
