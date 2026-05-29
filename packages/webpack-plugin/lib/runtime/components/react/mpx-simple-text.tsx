import { Text, TextStyle, TextProps } from 'react-native'
import { JSX, createElement, useMemo } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject, getDefaultAllowFontScaling, useTextPassThroughValue, wrapChildren, isStringChildren, transformBoxSizing, splitStyle, isBoxSizingAffectingStyle } from './utils'

const SimpleText = (props: TextProps): JSX.Element => {
  let hasBoxSizingAffectingStyle = false
  const { textStyle = {} } = splitStyle(props.style || {}, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const isStringOnly = isStringChildren(props.children)
  const childTextStyle: TextStyle | undefined = !isStringOnly && Object.keys(textStyle).length ? textStyle as TextStyle : undefined
  const textPassThroughValue = useTextPassThroughValue(
    childTextStyle,
    undefined,
    {
      enableTextPassThrough: true
    }
  )
  const mergedStyle = extendObject({}, textPassThroughValue?.textStyle, props.style)
  transformBoxSizing(mergedStyle, hasBoxSizingAffectingStyle)
  const mergedProps = extendObject({}, textPassThroughValue?.pendingTextProps, props)
  const {
    allowFontScaling,
    children
  } = mergedProps
  const childTextPassThrough = useMemo(() => {
    if (isStringOnly) return null
    return textPassThroughValue?.pendingTextProps
      ? extendObject({}, textPassThroughValue, { pendingTextProps: undefined })
      : textPassThroughValue
  }, [isStringOnly, textPassThroughValue])

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
      textPassThrough: childTextPassThrough
    }
  ))
}

SimpleText.displayName = 'MpxSimpleText'

export default SimpleText
