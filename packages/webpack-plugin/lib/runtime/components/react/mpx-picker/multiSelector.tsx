import { View, Text, TouchableWithoutFeedback } from 'react-native'
import AntPicker, { PickerProps, PickerValue } from '@ant-design/react-native/lib/picker'
import React, { forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
import { MultiSelectorProps, EventType } from './type'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数

function convertToObj(item?: any, rangeKey = ''): any {
  if (typeof item === 'object') {
    return { value: item[rangeKey], label: item[rangeKey] }
  } else {
    return { value: item, label: item }
  }
}

// eslint-disable-next-line default-param-last
function formatRangeFun(range: any[][] = [], rangeKey?: string): any[] {
  const result = (range[0] || []).map(item => {
    return convertToObj(item, rangeKey)
  })
  let tmp = result
  for (let i = 1; i < range.length; i++) {
    let child = Array.isArray(range[i]) ? range[i] : []
    const nextColData = child.map(item => {
      return convertToObj(item, rangeKey)
    })
    tmp.forEach(item => {
      item.children = nextColData
    })
    tmp = nextColData
  }
  return result
}

function getIndexByValues(range: any[] = [], value: any[] = []): number[] {
  let tmp = range
  return value.map(v => {
    for (let i = 0; i < tmp.length; i++) {
      if (tmp[i].value === v) {
        tmp = tmp[i].children || []
        return i
      }
    }
    return 0
  })
}
// [1,1,2] 寻找出[]
function getInnerValueByIndex(range: any[] = [], value: any[] = []): string[] {
  let tmp = range
  return value.map(v => {
    let current = tmp[v].value
    tmp = tmp[v].children
    return current
  })
}

const _MultiSelectorPicker = forwardRef<HandlerRef<View, MultiSelectorProps>, MultiSelectorProps>((props: MultiSelectorProps, ref): React.JSX.Element => {
  const { range, value, disabled, bindchange, bindcancel, children } = props
  let formatRange = formatRangeFun(range, props['range-key'])
  let initValue = getInnerValueByIndex(formatRange, value)
  // 选中的索引值
  const [selected, setSelected] = useState(initValue)
  // range数据源
  const [data, setData] = useState(formatRange || [])

  useEffect(() => {
    if (range) {
      const newFormatRange = formatRangeFun(range, props['range-key'])
      setData(newFormatRange)
    }
    const newValue = getInnerValueByIndex(formatRange, value)
    value && setSelected(newValue)
  }, [range, value])

  const onChange = (value: PickerValue[]) => {
    // e.detail.value 都是索引multi
    const strIndex = getIndexByValues(data, value)
    bindchange && bindchange({
      detail: {
        value: strIndex
      }
    })
  }
  const antPickerProps = {
    data,
    value: selected,
    cols: range.length,
    defaultValue: initValue,
    disabled,
    itemHeight: 40,
    onChange,
    onDismiss: bindcancel && bindcancel,
  } as PickerProps

  return (<AntPicker {...antPickerProps}>
      <TouchableWithoutFeedback>
        {children}
      </TouchableWithoutFeedback>
    </AntPicker>
  )
})

_MultiSelectorPicker.displayName = 'mpx-picker-multiselector'

export default _MultiSelectorPicker
