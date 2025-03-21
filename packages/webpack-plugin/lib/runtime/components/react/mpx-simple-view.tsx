import { View, ViewProps } from 'react-native'
import { createElement, forwardRef } from 'react'
import { HandlerRef } from './useNodesRef'
import useInnerProps from './getInnerListeners'

const _View2 = forwardRef<HandlerRef<View, ViewProps>, ViewProps>((props: ViewProps, ref) => {
  const innerProps = useInnerProps(props, {}, [], {})
  return createElement(View, innerProps)
})

_View2.displayName = 'MpxSimpleView'

export default _View2
