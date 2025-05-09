import type { _ViewProps } from '../mpx-view'
import { useRef, useEffect, useMemo } from 'react'
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
  SharedValue,
  WithTimingConfig,
  AnimationCallback
} from 'react-native-reanimated'
import { error, hasOwn } from '@mpxjs/utils'
import { formatStyle, getTransformObj } from './utils'
import type { ExtendedViewStyle } from '../types/common'
import useAnimationAPIHooks from './useAnimationAPIHooks'
import useTransitionHooks from './useTransitionHooks'

// 动画类型
const enum AnimationType {
    None,
    API,
    CssTransition,
    CssAnimation
}

export default function useAnimationHooks<T, P> (props: _ViewProps & { enableAnimation?: boolean }) {
  const { style = {}, enableAnimation, animation } = props
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

  const originalStyle = formatStyle(style)

  switch (animationTypeRef.current) {
    case AnimationType.API:
      return {
        enableStyleAnimation: enableAnimationRef.current,
        animationStyle: useAnimationAPIHooks({
          style: originalStyle,
          animation
        })
      }
    case AnimationType.CssTransition:
      return {
        enableStyleAnimation: enableAnimationRef.current,
        animationStyle: useAnimationAPIHooks({
          style: originalStyle
        })
      }
    default:
      return { enableStyleAnimation: true }
  }
}
