import { Text, TextProps } from 'react-native'
import { JSX, createElement } from 'react'

import { extendObject } from './utils'

const _Text2 = (props: TextProps): JSX.Element => {
  const {
    allowFontScaling = false
  } = props

  return createElement(Text, extendObject({}, props, {
    allowFontScaling
  }))
}

_Text2.displayName = 'MpxSimpleText'

export default _Text2
