import React, { ReactNode } from 'react'
import { View } from 'react-native';

interface SwiperItemProps {
  'item-id'?: string
  children?: ReactNode;
}

const SwiperItem = (props: SwiperItemProps) => {
  const { children, ...restProps } = props
  return (
    <View
      data-itemId={props['item-id']}
      {...restProps}
    >
      {children}
    </View>
  )
}

export default SwiperItem
