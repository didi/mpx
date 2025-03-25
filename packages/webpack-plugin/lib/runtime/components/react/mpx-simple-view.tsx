import { View, ViewProps, TextStyle } from 'react-native'
import { createElement, forwardRef, useRef } from 'react'
import useNodesRef, { HandlerRef } from './useNodesRef'
import useInnerProps from './getInnerListeners'
import { extendObject, splitProps, splitStyle, wrapChildren } from './utils'

const _View2 = forwardRef<HandlerRef<View, ViewProps>, ViewProps>((simpleViewProps: ViewProps, ref) => {
  const nodeRef = useRef(null)

  const { textProps, innerProps: props = {} } = splitProps(simpleViewProps)

  const { textStyle, innerStyle = {} } = splitStyle(props.style || {})

  useNodesRef(props, ref, nodeRef, {
    style: props.style || {}
  })

  const innerProps = useInnerProps(props, {
    style: innerStyle,
    ref: nodeRef
  }, [], {})

  return createElement(View, extendObject({}, innerProps, wrapChildren(
    props,
    {
      hasVarDec: false,
      varContext: null,
      textStyle: textStyle as TextStyle,
      textProps
    }
  )))
})

_View2.displayName = 'MpxSimpleView'

export default _View2
