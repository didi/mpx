/**
 * 普通选择器，range可以是Array<Obj> 也可以是Array
 */
import { View, TouchableWithoutFeedback } from 'react-native'
import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { Picker, PickerColumn, PickerValue } from '@ant-design/react-native'
import { SelectorProps, Obj, LayoutType } from './type'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数

type RangeItemType = Obj | number | string

const formatRangeFun = (range: Array<RangeItemType>, rangeKey = ''): any => {
  let newRange: Object[] = []
  newRange = (range || []).map((item: RangeItemType, index) => {
    if (typeof item === 'object') {
      return { value: index, label: item[rangeKey as string] }
    } else {
      return { value: index, label: item }
    }
  })
  return newRange as PickerColumn
}

const _SelectorPicker = forwardRef<HandlerRef<View, SelectorProps>, SelectorProps>((props: SelectorProps, ref): React.JSX.Element => {
  const { range, children, value, disabled, bindchange, bindcancel, style } = props
  // 格式化数据为Array<*>
  const formatRange: PickerColumn = formatRangeFun(range, props['range-key'])
  // 选中的索引值
  const [selected, setSelected] = useState<PickerValue>(value || 0)
  // range数据源
  const [data, setData] = useState(formatRange || [])
  // 存储layout布局信息
  const layoutRef = useRef({})
  const viewRef = useRef<View>(null)
  const nodeRef = useRef(null)
  useNodesRef<View, SelectorProps>(props, ref, nodeRef, {
    style
  })

  useEffect(() => {
    if (range) {
      const newFormatRange = formatRangeFun(range, props['range-key'])
      setData(newFormatRange)
    }
    setSelected(() => {
      return value
    })
  }, [range, value])
  const defaultValue = [value]

  const onChange = (value: PickerValue[]) => {
    bindchange && bindchange({
      detail: {
        value: value && value[0]
      }
    })
  }

  const onElementLayout = (layout: LayoutType) => {
    viewRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      props.getInnerLayout && props.getInnerLayout(layoutRef)
    })
  }

  const antPickerProps = {
    ref: nodeRef,
    data,
    value: [selected],
    cols: 1,
    defaultValue,
    itemHeight: 40,
    onChange,
    onDismiss: bindcancel && bindcancel
  } as any

  const touchProps = {
    onLayout: onElementLayout,
    ref: viewRef
  }
  return (
    <Picker
      {...antPickerProps}>
        <TouchableWithoutFeedback>
          <View {...touchProps}>
            {children}
          </View>
        </TouchableWithoutFeedback>
    </Picker>
  )
})

_SelectorPicker.displayName = 'mpx-picker-selector'

export default _SelectorPicker
