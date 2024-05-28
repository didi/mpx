import React, { forwardRef, useRef } from 'react'
import { View } from 'react-native';
import useInnerProps from './getInnerListeners'
import useNodesRef from '../../useNodesRef'

interface SwiperItemProps {
  'item-id'?: string;
  'enable-offset'?: boolean;
  children?: ReactNode;
}

const _SwiperItem = forwardRef((props: SwiperItemProps, ref) => {
  const { children, 'enable-offset': enableOffset } = props
  const layoutRef = useRef({})
  const { nodeRef } = useNodesRef(props, ref, {})

  const onLayout = () => {
    nodeRef.current?.measure((x, y, width, height, offsetLeft, offsetTop) => {
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
