/**
 * 普通选择器，range可以是Array<Obj> 也可以是Array
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native'
import React, { forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
import AntPicker, { PickerProps, PickerColumn, PickerValue, PickerColumnItem } from '@ant-design/react-native/lib/picker'
import { PickerViewPropsType } from '@ant-design/react-native/lib/picker-view/PropsType'
import { SelectorProps, Obj } from './type'
import useNodesRef, { HandlerRef } from '../../../useNodesRef' // 引入辅助函数

type RangeItemType = Obj | number | string

const styles: { [key: string]: Object } = {
  outerStyle: {
    flex: 1,
    width: "100%"
  },
  pickerViewStyle: {
    width: "100%",
    flex: 1
  }
}

const  formatRangeFun = (range: Array<RangeItemType>, rangeKey = ''): any => {
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
  const { range, children, value, disabled, bindchange, bindcancel } = props
  // 格式化数据为Array<*>
  let formatRange: PickerColumn = formatRangeFun(range, props['range-key'])
  // 选中的索引值
  const [selected, setSelected] = useState<PickerValue>(value || 0)
  // range数据源
  const [data, setData] = useState(formatRange || [])

  useEffect(() => {
    if (range) {
      const newFormatRange = formatRangeFun(range, props['range-key'])
      setData(newFormatRange)
    }
    value && setSelected(value)
  }, [range, value])
  const defaultValue = [value]
  
  const onChange = (value: PickerValue[]) => {
    bindchange && bindchange({
      detail: {
        value: value && value[0]
      }
    })
  }
  const antPickerProps = {
    data,
    value: [selected],
    cols: 1,
    defaultValue,
    itemHeight: 40,
    onChange,
    onDismiss: bindcancel && bindcancel
  } as PickerViewPropsType
  return (
    <AntPicker
      {...antPickerProps}>
        <TouchableWithoutFeedback>
          {children}
        </TouchableWithoutFeedback>
    </AntPicker>
  )
})

_SelectorPicker.displayName = 'mpx-picker-selector';

export default _SelectorPicker
