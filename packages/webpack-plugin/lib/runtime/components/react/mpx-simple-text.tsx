import { Text, TextStyle, TextProps } from 'react-native'
import { JSX, createElement } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject, getDefaultAllowFontScaling, useTextPassThroughText, wrapChildren, isStringChildren, transformBoxSizing, splitStyle, isBoxSizingAffectingStyle } from './utils'

const SimpleText = (props: TextProps): JSX.Element => {
  let hasBoxSizingAffectingStyle = false
  const { textStyle } = splitStyle(props.style || {}, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const isStringOnly = isStringChildren(props.children)
  const childTextStyle: TextStyle | undefined = !isStringOnly ? textStyle as TextStyle : undefined
  const { inheritedText, textPassThrough } = useTextPassThroughText(childTextStyle)
  const mergedStyle = extendObject({}, inheritedText?.textStyle, props.style)
  const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props)
  transformBoxSizing(mergedStyle, hasBoxSizingAffectingStyle)
  const {
    allowFontScaling,
    children
  } = mergedProps

  const innerProps = useInnerProps(
    extendObject(
      {},
      mergedProps,
      {
        allowFontScaling: allowFontScaling ?? getDefaultAllowFontScaling(),
        style: mergedStyle
      }
    )
  )

  return createElement(Text, innerProps, wrapChildren(
    { children },
    {
      hasVarDec: false,
      textPassThrough
    }
  ))
}

SimpleText.displayName = 'MpxSimpleText'

export default SimpleText
