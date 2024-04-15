/**
 * ✔ selectable
 * ✘ space
 * ✘ decode: Fixed value TRUE
 */

import * as React from 'react'
import { Text } from 'react-native'

const _Text = ({ style, children, selectable, onClick, ...otherProps }) => {
  return (
    <Text
      selectable={!!selectable}
      style={style}
      onPress={onClick}
      {...otherProps}
    >
      {children}
    </Text>
  )
}

_Text.displayName = '_Text'

export default _Text
