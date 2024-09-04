
import { View } from 'react-native'
import React, { forwardRef, useRef } from 'react'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { recordPerformance } from './performance'

interface ColumnProps {
  children: React.ReactNode
}

const _PickerViewColumn = forwardRef<HandlerRef<View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const startTime = new Date().getTime()

  const { children } = props
  const layoutRef = useRef({})
  const { nodeRef } = useNodesRef(props, ref, {})
  const innerProps = useInnerProps(props, {}, [], { layoutRef })
  const content = (
    <View
    ref={nodeRef}
    {...innerProps}>
    {children}
    </View>
  )

  recordPerformance(startTime, 'mpx-picker-view-column')
  
  return content
})

_PickerViewColumn.displayName = 'mpx-picker-view-column';

export default _PickerViewColumn

