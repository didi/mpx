import React, { forwardRef, useRef } from 'react'
import { View } from 'react-native';
import useInnerProps from './getInnerListeners'
import useNodesRef from '../../useNodesRef'

interface SwiperItemProps {
  'item-id'?: string
  children?: ReactNode;
}

const SwiperItem = forwardRef((props: SwiperItemProps, ref) => {
  const { children, ...restProps } = props
  const { nodeRef } = useNodesRef(props, ref, {
  })
  const innerProps = useInnerProps(props, {}, [], {})

  return (
    <View
      ref={nodeRef}
      data-itemId={props['item-id']}
      {...restProps}
      {...innerProps}>
      {children}
    </View>
  )
})

export default SwiperItem
