/**
 * 普通选择器，range可以是Array<Obj> 也可以是Array
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native'
import React, { forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
import AntPicker from '@ant-design/react-native/lib/picker'
// import Provider from '@ant-design/react-native/lib/provider'
import { SelectorProps } from './type'
import useNodesRef, { HandlerRef } from '../../../useNodesRef' // 引入辅助函数

type RangeItemType = Object | number | string
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

const  formatRangeFun = (range: Array<RangeItemType>, rangeKey = '') => {
  let newRange: Object[] = []
  newRange = (range || []).map((item: RangeItemType, index) => {
    if (typeof item === 'object') {
      return { value: index, lable: item[rangeKey]}
    } else {
      return { value: index, label: item }
    }
  })
  return newRange
}

const _SelectorPicker = forwardRef<HandlerRef<View, SelectorProps>, SelectorProps>((props: SelectorProps, ref) => {
  const { range, children, value, disabled, bindchange } = props
  // 格式化数据为Array<*>
  let formatRange: Object[] = formatRangeFun(range, props['range-key'])
  // 选中的索引值
  const [selected, setSelected] = useState(value || 0)
  // range数据源
  const [data, setData] = useState(formatRange || [])

  useEffect(() => {
    console.log('-------useEffect-change', range, value)
    if (range) {
      const newFormatRange = formatRangeFun(range, props['range-key'])
      setData(newFormatRange)
    }
    value && setSelected(value)
  }, [range, value])

  const defaultValue = value ? range[value] : range[0]
  
  const onChange = (e) => {
    // e.detail.value 都是索引
    console.log('-------------antpicker-onChange', e)
    bindchange && bindchange(e.detail.value && e.detail.value[0])
  }
  const antPickerProps = {
    data,
    value: selected,
    cols: 1,
    defaultValue,
    disabled,
    itemHeight: 40,
    // style: styles.outerStyle,
    // styles: styles.pickerViewStyle,
    onChange,
    onDismiss: props.bindcancel && props.bindcancel,
    okButtonProps: '',
    dismissButtonProps: ''
  }

  console.log('-------------antPickerProps', antPickerProps)
  return (
    <AntPicker
      {...antPickerProps}
      disabled={disabled}>
        <TouchableWithoutFeedback>
          {children}
        </TouchableWithoutFeedback>
    </AntPicker>
  )
})

_SelectorPicker.displayName = 'mpx-picker-selector';

export default _SelectorPicker
