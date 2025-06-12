/**
 * ✔ scale-area
 */

import { View } from 'react-native'
import { JSX, forwardRef, ReactNode, useRef, useMemo, useCallback, createElement } from 'react'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import useNodesRef, { HandlerRef } from './useNodesRef'
import useInnerProps from './getInnerListeners'
import { MovableAreaContext, MovableAreaContextValue } from './context'
import { useTransformStyle, wrapChildren, useLayout, extendObject } from './utils'
import Portal from './mpx-portal'

interface MovableAreaProps {
  style?: Record<string, any>
  children: ReactNode
  width?: number
  height?: number
  'scale-area'?: boolean
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
}

interface MovableViewCallbacks {
  onScale: (scaleInfo: {scale: number}) => void
  onScaleEnd?: () => void
}

const _MovableArea = forwardRef<HandlerRef<View, MovableAreaProps>, MovableAreaProps>((props: MovableAreaProps, ref): JSX.Element => {
  const {
    style = {},
    'scale-area': scaleArea = false,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  const {
    hasSelfPercent,
    normalStyle,
    hasVarDec,
    varContextRef,
    hasPositionFixed,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const movableViewRef = useRef(null)
  const movableViewsRef = useSharedValue<Record<string, MovableViewCallbacks>>({})

  useNodesRef(props, ref, movableViewRef, {
    style: normalStyle
  })

  // 注册/注销 MovableView 的回调
  const registerMovableView = useCallback((id: string, callbacks: MovableViewCallbacks) => {
    movableViewsRef.value = { ...movableViewsRef.value, [id]: callbacks }
  }, [])

  const unregisterMovableView = useCallback((id: string) => {
    delete movableViewsRef.value[id]
  }, [])

  // 处理区域缩放手势
  const handleAreaScale = useCallback((scaleInfo: { scale: number }) => {
    'worklet'
    if (scaleArea && Object.keys(movableViewsRef.value).length > 0) {
      // 将缩放信息广播给所有注册的 MovableView
      Object.values(movableViewsRef.value).forEach((callbacks) => {
        callbacks.onScale(scaleInfo)
      })
    }
  }, [scaleArea])

  // 处理区域缩放结束
  const handleAreaScaleEnd = useCallback(() => {
    'worklet'
    if (scaleArea && Object.keys(movableViewsRef.value).length > 0) {
      // 通知所有注册的 MovableView 缩放结束
      Object.values(movableViewsRef.value).forEach((callbacks) => {
        callbacks.onScaleEnd?.()
      })
    }
  }, [scaleArea])

  const contextValue: MovableAreaContextValue = useMemo(() => ({
    height: normalStyle.height || 10,
    width: normalStyle.width || 10,
    scaleArea,
    registerMovableView,
    unregisterMovableView
  }), [normalStyle.width, normalStyle.height, scaleArea, handleAreaScale, registerMovableView, unregisterMovableView])

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: movableViewRef })

  // 创建缩放手势
  const scaleGesture = useMemo(() => {
    if (!scaleArea) return null

    return Gesture.Pinch()
      .onUpdate((e) => {
        'worklet'
        handleAreaScale(e)
      })
      .onEnd(() => {
        'worklet'
        handleAreaScaleEnd()
      })
  }, [scaleArea, handleAreaScale, handleAreaScaleEnd])

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      layoutProps,
      {
        style: extendObject({ height: contextValue.height, width: contextValue.width }, normalStyle, layoutStyle),
        ref: movableViewRef
      }
    ),
    [],
    { layoutRef }
  )

  let movableComponent: JSX.Element = createElement(MovableAreaContext.Provider, { value: contextValue }, createElement(
    View,
    innerProps,
    wrapChildren(
      props,
      {
        hasVarDec,
        varContext: varContextRef.current
      }
    )
  ))

  // 如果启用了 scale-area，包装一个 GestureDetector
  if (scaleArea && scaleGesture) {
    movableComponent = createElement(MovableAreaContext.Provider, { value: contextValue }, createElement(
      GestureDetector,
      { gesture: scaleGesture },
      createElement(
        View,
        innerProps,
        wrapChildren(
          props,
          {
            hasVarDec,
            varContext: varContextRef.current
          }
        )
      )
    ))
  }

  if (hasPositionFixed) {
    movableComponent = createElement(Portal, null, movableComponent)
  }

  return movableComponent
})

_MovableArea.displayName = 'MpxMovableArea'

export default _MovableArea
