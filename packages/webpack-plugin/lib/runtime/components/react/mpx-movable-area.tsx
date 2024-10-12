/**
 * ✘ scale-area
 */

import { View, LayoutChangeEvent } from 'react-native'
import { JSX, useState, useEffect, useRef, forwardRef, ReactNode } from 'react'
import useNodesRef, { HandlerRef } from './useNodesRef'
import useInnerProps from './getInnerListeners'
import { MovableAreaContext } from './context'
import { splitProps, splitStyle, useTransformStyle } from './utils'
import { wrapChildren } from './common'

interface MovableAreaProps {
  style?: Record<string, any>;
  children: ReactNode;
  width?: number;
  height?: number;
  'enable-offset'?: boolean;
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
}

const _MovableArea = forwardRef<HandlerRef<View, MovableAreaProps>, MovableAreaProps>((movableAreaProps: MovableAreaProps, ref): JSX.Element => {
  const { textProps, innerProps: props } = splitProps(movableAreaProps)

  const { style = {}, width = 10, height = 10, 'enable-var': enableVar, 'external-var-context': externalVarContext, 'enable-offset': enableOffset } = props
  const [areaWidth, setAreaWidth] = useState(0)
  const [areaHeight, setAreaHeight] = useState(0)

  const layoutRef = useRef<any>({})

  useEffect(() => {
    setAreaWidth(width)
    setAreaHeight(height)
  }, [width, height])

  const {
    normalStyle,
    hasVarDec,
    varContextRef
  } = useTransformStyle(style, { enableVar, externalVarContext, enableLineHeight: false })

  const { textStyle, innerStyle } = splitStyle(normalStyle)

  const { nodeRef: movableViewRef } = useNodesRef(props, ref)

  const onLayout = (e: LayoutChangeEvent) => {
    const { width = 10, height = 10 } = e.nativeEvent.layout
    setAreaWidth(width)
    setAreaHeight(height)
    if (enableOffset) {
      movableViewRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
        layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      })
    }
  }
  const innerProps = useInnerProps(props, {
    ref: movableViewRef,
    onLayout
  }, [
    'children',
    'style'
  ], { layoutRef })

  return (
    <MovableAreaContext.Provider value={{ height: areaHeight, width: areaWidth }}>
      <View
        {...innerProps}
        style={{
          height: areaHeight,
          width: areaWidth,
          overflow: 'hidden',
          ...innerStyle
        }}
      >
         {
        wrapChildren(
          props,
          {
            hasVarDec,
            varContext: varContextRef.current
          },
          {
            textStyle,
            textProps
          }
        )
      }
      </View>
    </MovableAreaContext.Provider>
  )
})

_MovableArea.displayName = 'mpx-movable-area'

export default _MovableArea
