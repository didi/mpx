import { Text, TextProps } from 'react-native'
import { JSX, createElement, useContext } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject, getDefaultAllowFontScaling, useTextPassThroughValue, wrapChildren, isStringChildren } from './utils'
import { TextPassThroughContext } from './context'

const SimpleText = (props: TextProps): JSX.Element => {
  const inheritedText = useContext(TextPassThroughContext)
  const style = extendObject({}, inheritedText?.textStyle, props.style)
  const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props, { style })
  const {
    allowFontScaling,
    children
  } = mergedProps

  const innerProps = useInnerProps(
    extendObject(
      {},
      mergedProps,
      {
        allowFontScaling: allowFontScaling ?? getDefaultAllowFontScaling()
      }
    )
  )
  const isStringOnly = isStringChildren(children)
  const childTextPassThrough = useTextPassThroughValue(
    Object.keys(style).length ? style : undefined,
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
