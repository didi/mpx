import { error, collectDataset } from '@mpxjs/utils'
import { useRef } from 'react'
import { transition } from './utils'
import useAnimationAPIHooks from './useAnimationAPIHooks'
import useTransitionHooks from './useTransitionHooks'
import type { AnimatableValue } from 'react-native-reanimated'
import type { MutableRefObject } from 'react'
import type { NativeSyntheticEvent } from 'react-native'
import type { _ViewProps } from '../mpx-view'

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
  // 记录动画类型 优先级 css transition > API
  let animationType = AnimationType.None
  const propNames = Object.keys(originalStyle)
  if (propNames.find(item => item.includes('animation'))) {
    // css animation 只做检测提示
    animationType = AnimationType.CssAnimation
  }
  if (!!animation || enableAnimation === true) {
    animationType = AnimationType.API
  }
  if (propNames.find(item => item.includes(transition))) {
    animationType = AnimationType.CssTransition
  }
  // 优先以 enableAnimation 定义类型为准
  if (enableAnimation === AnimationType.API || enableAnimation === AnimationType.CssTransition || enableAnimation === AnimationType.CssAnimation) {
    animationType = enableAnimation
  }
  const animationTypeRef = useRef(animationType)
  if (animationTypeRef.current === AnimationType.CssAnimation) {
    // 暂不支持 CssAnimation 提示
    error('[Mpx runtime error]: CSS animation is not supported yet')
  }
  if (animationType! && animationTypeRef.current !== animationType) {
    // 允许 API、CssTransition 到 none，不允许 API、CssTransition 互切，不允许 none 到 API、CssTransition
    error('[Mpx runtime error]: The animation type should be stable in the component lifecycle, or you can set animation type with [enable-animation].')
  }
  if (!animationTypeRef.current) return { enableStyleAnimation: false }

  const hooksProps = { style: originalStyle }
  if (transitionend && typeof transitionend === 'function') {
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
    Object.assign(hooksProps, { transitionend: withTimingCallback })
  }
  if (animationTypeRef.current === AnimationType.API) {
    Object.assign(hooksProps, { animation })
  }
  return {
    enableStyleAnimation: !!animationTypeRef.current,
    animationStyle: animationTypeRef.current === AnimationType.API
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ? useAnimationAPIHooks(hooksProps)
      // eslint-disable-next-line react-hooks/rules-of-hooks
      : useTransitionHooks(hooksProps)
  }
}
