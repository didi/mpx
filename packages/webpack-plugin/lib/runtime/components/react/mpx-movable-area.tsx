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

  const movableAreaRef = useRef(null)
  const movableViewsValue = useSharedValue<Record<string, MovableViewCallbacks>>({})
  useNodesRef(props, ref, movableAreaRef, {
    style: normalStyle
  })

  // 注册/注销 MovableView 的回调
  const registerMovableView = useCallback((id: string, callbacks: { onScale?: (scaleInfo: { scale: number }) => void; onScaleEnd?: () => void }) => {
    movableViewsValue.value = extendObject(movableViewsValue.value, { [id]: callbacks })
  }, [])

  const unregisterMovableView = useCallback((id: string) => {
    delete movableViewsValue.value[id]
  }, [])

  // 处理区域缩放手势
  const handleAreaScale = useCallback((scaleInfo: { scale: number }) => {
    'worklet'
    if (scaleArea) {
      // 将缩放信息广播给所有注册的 MovableView
      Object.values(movableViewsValue.value).forEach((callbacks) => {
        callbacks.onScale && callbacks.onScale(scaleInfo)
      })
    }
  }, [scaleArea])

  // 处理区域缩放结束
  const handleAreaScaleEnd = useCallback(() => {
    'worklet'
    if (scaleArea) {
      // 通知所有注册的 MovableView 缩放结束
      Object.values(movableViewsValue.value).forEach((callbacks) => {
        callbacks.onScaleEnd && callbacks.onScaleEnd()
      })
    }
  }, [scaleArea])

  const contextValue: MovableAreaContextValue = useMemo(() => ({
    height: normalStyle.height || 10,
    width: normalStyle.width || 10,
    scaleArea,
    registerMovableView,
    unregisterMovableView
  }), [normalStyle.width, normalStyle.height, scaleArea])

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: movableAreaRef })

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
  }, [scaleArea])

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      layoutProps,
      {
        style: extendObject({ height: contextValue.height, width: contextValue.width }, normalStyle, layoutStyle),
        ref: movableAreaRef
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
