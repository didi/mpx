import { error, collectDataset, hasOwn } from '@mpxjs/utils'
import { useEffect, useRef } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  cancelAnimation,
  interpolateColor
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
const enum AnimationType {
  None,
  API,
  CssTransition,
  CssAnimation
}

export default function useAnimationHooks<T, P> (props: _ViewProps & { enableAnimation?: boolean, layoutRef: MutableRefObject<any>, transitionend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void }) {
  const { style: originalStyle = {}, enableAnimation, animation, transitionend, layoutRef } = props
  // 记录动画类型
  // Todo 优先级 API > css transition > css animation
  const propNames = Object.keys(originalStyle)
  const animationType = animation ? AnimationType.API : propNames.find(item => item.includes(Transition)) ? AnimationType.CssTransition : propNames.find(item => item.includes('animation')) ? AnimationType.CssAnimation : AnimationType.None
  const animationTypeRef = useRef(animationType)
  const enableStyleAnimation = enableAnimation || animationType !== AnimationType.None
  const enableAnimationRef = useRef(enableStyleAnimation)
  // console.log(`useAnimationHooks animationType=${animationTypeRef.current} animationType=${enableAnimationRef.current}`)
  if (animationTypeRef.current !== AnimationType.None && animationTypeRef.current !== animationType) {
    error('[Mpx runtime error]: animationType should be stable, it is not allowed to switch CSS animation, API animation or CSS animation in the component lifecycle')
  }
  if (enableAnimationRef.current !== enableStyleAnimation) {
    error('[Mpx runtime error]: animation usage should be stable in the component lifecycle, or you can set [enable-animation] with true.')
  }
  if (!enableAnimationRef.current || animationTypeRef.current === AnimationType.None || animationTypeRef.current === AnimationType.CssAnimation) {
    animationTypeRef.current === AnimationType.CssAnimation && error('[Mpx runtime error]: CSS animation is not supported yet')
    return { enableStyleAnimation: false }
  }
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
  function updateStyleVal () {
    Object.entries(originalStyle).forEach(([key, value]) => {
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
  function withTimingCallback (finished?: boolean, current?: AnimatableValue, duration?: number) {
    if (!transitionend) return
    const target = {
      id: animation?.id || -1,
      dataset: collectDataset(props),
      offsetLeft: layoutRef?.current?.offsetLeft || 0,
      offsetTop: layoutRef?.current?.offsetTop || 0
    }
    transitionend({
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
      transitionend: withTimingCallback
    })
    // eslint-disable-next-line react-hooks/rules-of-hooks
    : useTransitionHooks({
      style: originalStyle,
      transitionend: withTimingCallback
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
    if (animationTypeRef.current === AnimationType.API) {
      // 仅 animation api style 更新同步更新 shareVal
      updateStyleVal()
    } else {
      // css 动画依赖为 style 变更
      // css transition 为 style 变更驱动，但首次不计入
      animationDeps.current += 1
    }
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
    enableStyleAnimation: enableAnimationRef.current,
    animationStyle
  }
}
