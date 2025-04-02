import { View, ViewProps, TextStyle } from 'react-native'
import { createElement, forwardRef } from 'react'
import { HandlerRef } from './useNodesRef'
import { extendObject, splitProps, splitStyle, wrapChildren } from './utils'

const _View2 = forwardRef<HandlerRef<View, ViewProps>, ViewProps>((simpleViewProps: ViewProps, ref) => {
  const { textProps, innerProps: props = {} } = splitProps(simpleViewProps)

  const { textStyle, innerStyle = {} } = splitStyle(props.style || {})

  return createElement(View, extendObject({}, props, {
    style: innerStyle
  }), wrapChildren(
    props,
    {
      hasVarDec: false,
      textStyle: textStyle as TextStyle,
      textProps
    }
  ))
})

_View2.displayName = 'MpxSimpleView'

export default _View2
