import { View, ViewProps, TextStyle } from 'react-native'
import { createElement, forwardRef, useRef } from 'react'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { extendObject, splitProps, splitStyle, wrapChildren } from './utils'

const _View2 = forwardRef<HandlerRef<View, ViewProps>, ViewProps>((simpleViewProps: ViewProps, ref) => {
  const nodeRef = useRef(null)

  const { textProps, innerProps: props = {} } = splitProps(simpleViewProps)

  const { textStyle, innerStyle = {} } = splitStyle(props.style || {})

  useNodesRef(props, ref, nodeRef, {
    style: innerStyle || {}
  })

  return createElement(View, extendObject({}, props, {
    style: innerStyle,
    ref: nodeRef
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
