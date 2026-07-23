import { Text, TextProps } from 'react-native'
import { JSX, createElement, useContext } from 'react'

import { extendObject, getDefaultAllowFontScaling, resolveTextLineHeightPercentStyle } from './utils'
import { TextPassThroughContext } from './context'

const InlineText = (props: TextProps): JSX.Element => {
  const inheritedText = useContext(TextPassThroughContext)
  const mergedStyle = inheritedText?.textStyle
    ? extendObject({}, inheritedText.textStyle)
    : undefined
  // inline-text 只包裹裸文本，消费继承文本样式中的相对 lineHeight，不处理本地样式。
  if (inheritedText?.textStyle) {
    resolveTextLineHeightPercentStyle(mergedStyle, inheritedText.textStyle)
  }
  const mergedProps = inheritedText?.pendingTextProps
    ? extendObject({}, inheritedText.pendingTextProps, props)
    : props
  const {
    allowFontScaling,
    children
  } = mergedProps

  return createElement(Text, extendObject({}, mergedProps, {
    allowFontScaling: allowFontScaling ?? getDefaultAllowFontScaling(),
    style: mergedStyle
  }), children)
}

InlineText.displayName = 'MpxInlineText'

export default InlineText
