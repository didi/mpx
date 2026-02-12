import { Text, TextProps, TextStyle } from 'react-native'
import { JSX, createElement, ReactNode } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject, useAddSpace } from './utils'

interface _TextProps extends TextProps {
  style?: TextStyle
  children?: ReactNode
  'enable-android-align-center'?: boolean
  'enable-add-space'?: boolean
  'space-font-size'?: number
}

const SimpleText = (props: _TextProps): JSX.Element => {
  const {
    allowFontScaling = false,
    'enable-android-align-center': enableAndroidAlignCenter,
    'enable-add-space': enableAddSpace,
    'space-font-size': spaceFontSize
  } = props

  const extendStyle = enableAndroidAlignCenter ? { includeFontPadding: false, textAlignVertical: 'center' } : null

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        allowFontScaling,
        style: extendStyle ? extendObject({}, props.style, extendStyle) : props.style
      }
    ),
    ['enable-android-align-center', 'enable-add-space', 'space-font-size']
  )

  const children = useAddSpace(props.children, { enableAddSpace, spaceFontSize })

  return createElement(Text, innerProps, children)
}

SimpleText.displayName = 'MpxSimpleText'

export default SimpleText
