import React from 'react';
import { View } from 'react-native';

const SwiperItem = (props) => {
  const { itemId, children, ...restProps } = props
  return (
    <View
      item-id={itemId}
      {...restProps}
    >
      {children}
    </View>
  )
}

export default SwiperItem
