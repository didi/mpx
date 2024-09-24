
import { View } from 'react-native'
import React, { forwardRef, useRef } from 'react'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数

interface ColumnProps {
  children: React.ReactNode
}

const _PickerViewColumn = forwardRef<HandlerRef<View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const { children } = props
  const layoutRef = useRef({})
  const { nodeRef } = useNodesRef(props, ref, {})
  const innerProps = useInnerProps(props, {}, [], { layoutRef })
  return (
    <View
    ref={nodeRef}
    {...innerProps}>
    {children}
    </View>
  )
})

_PickerViewColumn.displayName = 'mpx-picker-view-column';

export default _PickerViewColumn

