import { Text, TextProps, TextStyle } from 'react-native'
import { JSX, createElement, ReactNode } from 'react'

import { extendObject } from './utils'

interface _TextProps extends TextProps {
  style?: TextStyle
  children?: ReactNode
  'text-align-vertical'?: boolean
}

const InlineText = (props: _TextProps): JSX.Element => {
  const {
    allowFontScaling = false,
    'text-align-vertical': textAlignVertical
  } = props

  const extendStyle = textAlignVertical ? { includeFontPadding: false, textAlignVertical: 'center' } : null

  if (extendStyle) {
    props.style = extendObject({}, props.style, extendStyle)
  }

  return createElement(Text, extendObject({}, props, {
    allowFontScaling
  }))
}

InlineText.displayName = 'MpxInlineText'

export default InlineText
