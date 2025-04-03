import { Text, TextProps } from 'react-native'
import { JSX, createElement } from 'react'

import { extendObject } from './utils'

const InlineText = (props: TextProps): JSX.Element => {
  const {
    allowFontScaling = false
  } = props

  return createElement(Text, extendObject({}, props, {
    allowFontScaling
  }))
}

InlineText.displayName = 'MpxInlineText'

export default InlineText
