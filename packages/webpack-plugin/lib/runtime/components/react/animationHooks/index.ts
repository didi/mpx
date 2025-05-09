import { error, isFunction, collectDataset } from '@mpxjs/utils'

import { useRef } from 'react'
import { formatStyle } from './utils'
import useAnimationAPIHooks from './useAnimationAPIHooks'
import useTransitionHooks from './useTransitionHooks'
import type { AnimatableValue } from 'react-native-reanimated'
import type { MutableRefObject } from 'react'
import type { _ViewProps } from '../mpx-view'

// 动画类型
const enum AnimationType {
    None,
    API,
    CssTransition,
    CssAnimation
}

export default function useAnimationHooks<T, P> (props: _ViewProps & { enableAnimation?: boolean, layoutRef: MutableRefObject<any> }) {
  const { style = {}, enableAnimation, animation, catchtransitionend, bindtransitionend, layoutRef } = props
  const enableStyleAnimation = enableAnimation || !!animation || !!style.transition || !!style.transitionProperty || !!style.animation
  const enableAnimationRef = useRef(enableStyleAnimation)
  if (enableAnimationRef.current !== enableStyleAnimation) {
    error('[Mpx runtime error]: animation usage should be stable in the component lifecycle, or you can set [enable-animation] with true.')
  }
  // 记录动画类型
  // Todo 优先级
  const animationType = animation ? AnimationType.API : style.transition || style.transitionProperty ? AnimationType.CssTransition : style.animation ? AnimationType.CssAnimation : AnimationType.None
  const animationTypeRef = useRef(animationType)
  if (animationTypeRef.current !== AnimationType.None && animationTypeRef.current !== animationType) {
    error('[Mpx runtime error]: animationType should be stable, it is not allowed to switch CSS animation, API animation or CSS animation in the component lifecycle')
  }
  if (!enableAnimationRef.current) return { enableStyleAnimation: false }

  const transitionend = isFunction(catchtransitionend)
    ? catchtransitionend
    : isFunction(bindtransitionend)
      ? bindtransitionend
      : null

  function withTimingCallback (finished?: boolean, current?: AnimatableValue, duration?: number) {
    if (!transitionend) return
    const target = {
      id: animation?.id || -1,
      dataset: collectDataset(props),
      offsetLeft: layoutRef?.current?.offsetLeft || 0,
      offsetTop: layoutRef?.current?.offsetTop || 0
    }
    // Todo event 是否需要对齐wx，因为本身rn没有这个事件难以完全对齐
    transitionend({
      type: 'transitionend',
      __evName: 'transitionend',
      _userTap: false,
      detail: { elapsedTime: duration, finished, current },
      target,
      currentTarget: target,
      timeStamp: Date.now()
    })
  }

  const originalStyle = formatStyle(style)

  switch (animationTypeRef.current) {
    case AnimationType.API:
      return {
        enableStyleAnimation: enableAnimationRef.current,
        animationStyle: useAnimationAPIHooks({
          style: originalStyle,
          animation,
          bindtransitionend: withTimingCallback
        })
      }
    case AnimationType.CssTransition:
      return {
        enableStyleAnimation: enableAnimationRef.current,
        animationStyle: useTransitionHooks({
          style: originalStyle,
          bindtransitionend: withTimingCallback
        })
      }
    default:
      return { enableStyleAnimation: false }
  }
}
