import React from 'react'
import { Image } from 'react-native'

const FastImage = (props) => {
  return React.createElement(Image, {
    ...props,
    testID: props.testID || 'fast-image'
  })
}

FastImage.resizeMode = {
  contain: 'contain',
  cover: 'cover',
  stretch: 'stretch',
  center: 'center'
}

export default FastImage
