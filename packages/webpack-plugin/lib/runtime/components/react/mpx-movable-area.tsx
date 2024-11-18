/**
 * ✘ scale-area
 */

import { View, LayoutChangeEvent } from 'react-native'
import { JSX, useState, useEffect, forwardRef, ReactNode, useRef } from 'react'
import useNodesRef, { HandlerRef } from './useNodesRef'
import useInnerProps from './getInnerListeners'
import { MovableAreaContext } from './context'
import { useTransformStyle, wrapChildren, useLayout } from './utils'

interface MovableAreaProps {
  style?: Record<string, any>;
  children: ReactNode;
  width?: number;
  height?: number;
  'enable-offset'?: boolean;
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
}

const _MovableArea = forwardRef<HandlerRef<View, MovableAreaProps>, MovableAreaProps>((props: MovableAreaProps, ref): JSX.Element => {
  const { style = {}, width = 10, height = 10, 'enable-var': enableVar, 'external-var-context': externalVarContext, 'parent-font-size': parentFontSize, 'parent-width': parentWidth, 'parent-height': parentHeight } = props
  const [areaWidth, setAreaWidth] = useState(0)
  const [areaHeight, setAreaHeight] = useState(0)

  useEffect(() => {
    setAreaWidth(width)
    setAreaHeight(height)
  }, [width, height])

  const {
    hasSelfPercent,
    normalStyle,
    hasVarDec,
    varContextRef,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const movableViewRef = useRef(null)
  useNodesRef(props, ref, movableViewRef)

  const onLayout = (e: LayoutChangeEvent) => {
    const { width = 10, height = 10 } = e.nativeEvent.layout
    setAreaWidth(width)
    setAreaHeight(height)
  }

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: movableViewRef, onLayout })

  const innerProps = useInnerProps(props, {
    style: { height: areaHeight, width: areaWidth, overflow: 'hidden', ...normalStyle, ...layoutStyle },
    ref: movableViewRef,
    ...layoutProps
  }, [], { layoutRef })

  return (
    <MovableAreaContext.Provider value={{ height: areaHeight, width: areaWidth }}>
      <View
        {...innerProps}
      >
      {
        wrapChildren(
          props,
          {
            hasVarDec,
            varContext: varContextRef.current
          }
        )
      }
      </View>
    </MovableAreaContext.Provider>
  )
})

_MovableArea.displayName = 'mpx-movable-area'

export default _MovableArea
