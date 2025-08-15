import React from 'react'
import { View } from 'react-native'

const LinearGradient = (props) => {
  return React.createElement(View, {
    ...props,
    testID: props.testID || 'linear-gradient'
  }, props.children)
}

export default LinearGradient
