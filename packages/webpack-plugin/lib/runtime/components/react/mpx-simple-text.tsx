import { Text, TextProps, TextStyle } from 'react-native'
import { JSX, createElement, ReactNode } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject } from './utils'

interface _TextProps extends TextProps {
  style?: TextStyle
  children?: ReactNode
  'text-align-vertical'?: boolean
}

const SimpleText = (props: _TextProps): JSX.Element => {
  const {
    allowFontScaling = false,
    children,
    'text-align-vertical': textAlignVertical
  } = props

  const extendStyle = textAlignVertical ? { includeFontPadding: false, textAlignVertical: 'center' } : null

  if (extendStyle) {
    props.style = extendObject({}, props.style, extendStyle)
  }

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        allowFontScaling
      }
    ),
    ['text-align-vertical']
  )

  return createElement(Text, innerProps, children)
}

SimpleText.displayName = 'MpxSimpleText'

export default SimpleText
