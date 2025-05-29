import { error, collectDataset } from '@mpxjs/utils'
import { useRef } from 'react'
import { formatStyle } from './utils'
import useAnimationAPIHooks from './useAnimationAPIHooks'
import useTransitionHooks from './useTransitionHooks'
import type { AnimatableValue } from 'react-native-reanimated'
import type { MutableRefObject } from 'react'
import type { NativeSyntheticEvent } from 'react-native'
import type { _ViewProps } from '../mpx-view'

// 动画类型
const enum AnimationType {
  None,
  API,
  CssTransition,
  CssAnimation
}

export default function useAnimationHooks<T, P> (props: _ViewProps & { enableAnimation?: boolean, layoutRef: MutableRefObject<any>, transitionend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void }) {
  const { style = {}, enableAnimation, animation, transitionend, layoutRef } = props
  // 记录动画类型
  // Todo 优先级
  const propNames = Object.keys(style)
  const animationType = animation ? AnimationType.API : propNames.find(item => item.includes('transition')) ? AnimationType.CssTransition : propNames.find(item => item.includes('animation')) ? AnimationType.CssAnimation : AnimationType.None
  const animationTypeRef = useRef(animationType)
  const enableStyleAnimation = enableAnimation || animationType !== AnimationType.None
  const enableAnimationRef = useRef(enableStyleAnimation)
  console.log(`useAnimationHooks animationType=${animationTypeRef.current} animationType=${enableAnimationRef.current}`)
  if (animationTypeRef.current !== AnimationType.None && animationTypeRef.current !== animationType) {
    error('[Mpx runtime error]: animationType should be stable, it is not allowed to switch CSS animation, API animation or CSS animation in the component lifecycle')
  }
  if (enableAnimationRef.current !== enableStyleAnimation) {
    error('[Mpx runtime error]: animation usage should be stable in the component lifecycle, or you can set [enable-animation] with true.')
  }
  if (!enableAnimationRef.current) return { enableStyleAnimation: false }

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

  const originalStyle = formatStyle(style)

  switch (animationTypeRef.current) {
    case AnimationType.API:
      return {
        enableStyleAnimation: enableAnimationRef.current,
        animationStyle: useAnimationAPIHooks({
          style: originalStyle,
          animation,
          transitionend: withTimingCallback
        })
      }
    case AnimationType.CssTransition:
      return {
        enableStyleAnimation: enableAnimationRef.current,
        animationStyle: useTransitionHooks({
          style: originalStyle,
          transitionend: withTimingCallback
        })
      }
    case AnimationType.CssAnimation:
      error('[Mpx runtime error]: CSS animation is not supported yet')
      return {
        enableStyleAnimation: enableAnimationRef.current
      }
    default:
      return { enableStyleAnimation: false }
  }
}
