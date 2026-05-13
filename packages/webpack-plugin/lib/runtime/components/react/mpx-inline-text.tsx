import { Text, TextProps } from 'react-native'
import { JSX, createElement, useContext } from 'react'

import { extendObject, getDefaultAllowFontScaling } from './utils'
import { TextPassThroughContext } from './context'

const InlineText = (props: TextProps): JSX.Element => {
  const inheritedText = useContext(TextPassThroughContext)
  const style = extendObject({}, inheritedText?.textStyle, props.style)
  const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props, { style })
  const {
    allowFontScaling,
    children
  } = mergedProps

  return createElement(Text, extendObject({}, mergedProps, {
    allowFontScaling: allowFontScaling ?? getDefaultAllowFontScaling()
  }), children)
}

InlineText.displayName = 'MpxInlineText'

export default InlineText
