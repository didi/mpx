import { Text, TextStyle, TextProps } from 'react-native'
import { JSX, createElement, useContext } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject, getDefaultAllowFontScaling, useTextPassThroughValue, wrapChildren, isStringChildren, transformBoxSizing, splitStyle, isBoxSizingAffectingStyle } from './utils'
import { TextPassThroughContext } from './context'

const SimpleText = (props: TextProps): JSX.Element => {
  const inheritedText = useContext(TextPassThroughContext)
  const mergedStyle = extendObject({}, inheritedText?.textStyle, props.style)
  let hasBoxSizingAffectingStyle = false
  const { textStyle = {} } = splitStyle(mergedStyle, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const finalStyle = transformBoxSizing(mergedStyle, hasBoxSizingAffectingStyle)
  const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props)
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
        style: finalStyle
      }
    )
  )
  const isStringOnly = isStringChildren(children)
  const childTextStyle: TextStyle | undefined = !isStringOnly && Object.keys(textStyle).length ? textStyle : undefined
  const childTextPassThrough = useTextPassThroughValue(
    childTextStyle,
    undefined,
    {
      inheritTextProps: false,
      disabled: isStringOnly
    }
  )

  return createElement(Text, innerProps, wrapChildren(
    { children },
    {
      hasVarDec: false,
      textPassThrough: childTextPassThrough
    }
  ))
}

SimpleText.displayName = 'MpxSimpleText'

export default SimpleText
