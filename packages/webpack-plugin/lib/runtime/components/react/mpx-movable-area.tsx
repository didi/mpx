/**
 * ✘ scale-area
 */

import { View, LayoutChangeEvent } from 'react-native';
import { JSX, useState, useEffect, forwardRef, ReactNode } from 'react';
import useNodesRef, { HandlerRef } from '../../useNodesRef'

interface MovableAreaProps {
  style?: Record<string, any>;
  children: ReactNode;
  width?: number;
  height?: number;
}

const _MovableArea = forwardRef<HandlerRef<View, MovableAreaProps>, MovableAreaProps>((props: MovableAreaProps, ref): JSX.Element => {
  const { children, style } = props;
  const [areaWidth, setAreaWidth] = useState(0);
  const [areaHeight, setAreaHeight] = useState(0);


  useEffect(() => {
    setAreaWidth(props.width || 100)
    setAreaHeight(props.height || 100)
  }, []);

  const { nodeRef: movableViewRef } = useNodesRef(props, ref, {
    node: {}
  })

  function _onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout
    setAreaWidth(width)
    setAreaHeight(height)
  }

  return (
    <View
      ref={movableViewRef}
      style={[{ height: areaHeight, width: areaWidth, overflow: 'hidden' }, style]}
      onLayout={_onLayout}
    >
      {children}
    </View>
  );
})

_MovableArea.displayName = 'mpx-movable-area';

export default 'mpx-movable-area'