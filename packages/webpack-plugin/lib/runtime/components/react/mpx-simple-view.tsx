import { View, ViewProps } from 'react-native'
import { createElement, forwardRef, useRef } from 'react'
import useNodesRef, { HandlerRef } from './useNodesRef'
import useInnerProps from './getInnerListeners'
import { extendObject, useLayout } from './utils'

const _View2 = forwardRef<HandlerRef<View, ViewProps>, ViewProps>((props: ViewProps, ref) => {
  const nodeRef = useRef(null)

  const { layoutRef } = useLayout({ props, nodeRef })

  useNodesRef(props, ref, nodeRef, {
    style: props.style || {}
  })

  const innerProps = useInnerProps(props, {
    ref: nodeRef
  }, [], {
    layoutRef
  })

  return createElement(View, extendObject({}, innerProps, {
    children: props.children
  }))
})

_View2.displayName = 'MpxSimpleView'

export default _View2
