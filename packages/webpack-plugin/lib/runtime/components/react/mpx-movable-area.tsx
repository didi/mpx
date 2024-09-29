/**
 * ✘ scale-area
 */

import { View, LayoutChangeEvent } from 'react-native'
import { JSX, useState, useEffect, useRef, forwardRef, ReactNode } from 'react'
import useNodesRef, { HandlerRef } from './useNodesRef'
import useInnerProps from './getInnerListeners'
import { MovableAreaContext } from './context'

interface MovableAreaProps {
  style?: Record<string, any>;
  children: ReactNode;
  width?: number;
  height?: number;
}

const _MovableArea = forwardRef<HandlerRef<View, MovableAreaProps>, MovableAreaProps>((props: MovableAreaProps, ref): JSX.Element => {
  const { children, style = {}, width = 10, height = 10 } = props
  const [areaWidth, setAreaWidth] = useState(0)
  const [areaHeight, setAreaHeight] = useState(0)

  const layoutRef = useRef<any>({})

  useEffect(() => {
    setAreaWidth(width)
    setAreaHeight(height)
  }, [width, height])

  const { nodeRef: movableViewRef } = useNodesRef(props, ref)

  const onLayout = (e: LayoutChangeEvent) => {
    const { width = 10, height = 10 } = e.nativeEvent.layout
    setAreaWidth(width)
    setAreaHeight(height)
    movableViewRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
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
          ...style
        }}
      >
        {children}
      </View>
    </MovableAreaContext.Provider>
  )
})

_MovableArea.displayName = 'mpx-movable-area'

export default _MovableArea
