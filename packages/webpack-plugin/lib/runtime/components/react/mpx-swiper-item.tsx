import { View } from 'react-native'
import React, { forwardRef, useRef } from 'react'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数

interface SwiperItemProps {
  'item-id'?: string;
  'enable-offset'?: boolean;
  children?: React.ReactNode;
}

const _SwiperItem = forwardRef<HandlerRef<View, SwiperItemProps>, SwiperItemProps>((props: SwiperItemProps, ref) => {
  const { children, 'enable-offset': enableOffset } = props
  const layoutRef = useRef({})
  const { nodeRef } = useNodesRef(props, ref, {})

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }

  const innerProps = useInnerProps(props, {
    ...(enableOffset ? { onLayout } : {}),
  }, [
    'children',
    'enable-offset'
  ], { layoutRef })

  return (
    <View
      ref={nodeRef}
      data-itemId={props['item-id']}
      {...innerProps}>
      {children}
    </View>
  )
})

_SwiperItem.displayName = 'mpx-swiper-item';

export default _SwiperItem
