import { View, ViewProps, TextStyle } from 'react-native'
import { createElement } from 'react'
import { splitProps, splitStyle, wrapChildren, extendObject, useTextPassThrough, transformBoxSizing, isBoxSizingAffectingStyle } from './utils'
import useInnerProps from './getInnerListeners'

interface SimpleViewProps extends ViewProps {
  'enable-text-pass-through'?: boolean
}

const SimpleView = (simpleViewProps: SimpleViewProps): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(simpleViewProps)
  const enableTextPassThrough = props['enable-text-pass-through']

  let hasBoxSizingAffectingStyle = false
  const { textStyle, innerStyle = {} } = splitStyle(props.style || {}, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const textPassThrough = useTextPassThrough(textStyle as TextStyle, textProps, { enableTextPassThrough })

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
