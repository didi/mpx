import { View } from 'react-native'
import { ReactNode, forwardRef, useRef } from 'react'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数

interface SwiperItemProps {
  'item-id'?: string;
  'enable-offset'?: boolean;
  children?: ReactNode;
  style?: Object;
}

const _SwiperItem = forwardRef<HandlerRef<View, SwiperItemProps>, SwiperItemProps>((props: SwiperItemProps, ref) => {
  const { children, 'enable-offset': enableOffset, style } = props
  const layoutRef = useRef({})
  const { nodeRef } = useNodesRef(props, ref, {})

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }

  const innerProps = useInnerProps(props, {
    ...(enableOffset ? { onLayout } : {})
  }, [
    'children',
    'enable-offset'
  ], { layoutRef })

  return (
    <View
      ref={nodeRef}
      data-itemId={props['item-id']}
      style={[style]}
      {...innerProps}>
      {children}
    </View>
  )
})

_SwiperItem.displayName = 'MpxSwiperItem';

export default _SwiperItem
