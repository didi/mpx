import { View, ViewProps, TextStyle } from 'react-native'
import { createElement } from 'react'
import { splitProps, splitStyle, wrapChildren, extendObject, useTextPassThroughValue, transformBoxSizing, isBoxSizingAffectingStyle } from './utils'
import useInnerProps from './getInnerListeners'

const SimpleView = (simpleViewProps: ViewProps): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(simpleViewProps)

  let hasBoxSizingAffectingStyle = false
  const { textStyle, innerStyle = {} } = splitStyle(props.style || {}, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const textPassThrough = useTextPassThroughValue(textStyle as TextStyle, textProps)

  const styleObj = extendObject({}, innerStyle)
  transformBoxSizing(styleObj, hasBoxSizingAffectingStyle)

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        style: styleObj
      }
    )
  )

  return createElement(View, innerProps, wrapChildren(
    props,
    {
      hasVarDec: false,
      textPassThrough
    }
  ))
}

SimpleView.displayName = 'MpxSimpleView'

export default SimpleView
