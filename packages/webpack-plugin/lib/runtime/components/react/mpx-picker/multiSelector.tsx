import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MultiSelectorProps, Obj, RangeItem } from './type'
import MpxPickerView from '../mpx-picker-view'
import MpxPickerViewColumn from '../mpx-picker-view-column'
import { HandlerRef } from '../useNodesRef' // 引入辅助函数

const styles = StyleSheet.create({
  pickerContainer: {
    height: 240,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  },
  pickerIndicator: {
    height: 45
  },
  pickerItem: {
    fontSize: 18,
    lineHeight: 45,
    textAlign: 'center'
  }
})

const formatRangeFun = (range: RangeItem[], rangeKey = '') =>
  rangeKey ? range.map((item: Obj) => item[rangeKey]) : range

const formatValue = (value: number | number[]) => {
  const _value = Array.isArray(value) ? value : [value]
  return _value
}

const PickerMultiSelector = forwardRef<
    HandlerRef<View, MultiSelectorProps>,
    MultiSelectorProps
>((props: MultiSelectorProps, ref): React.JSX.Element => {
  const { range = [], bindchange, bindcolumnchange } = props
  const value = formatValue(props.value ?? [])
  const [formatRange, setFormatRange] = useState(formatRangeFun(range, props['range-key']))
  const nodeRef = useRef(null)
  const valuePrev = useRef(value)
  valuePrev.current = value

  const updateRange = (newRange: RangeItem[]) => {
    const range = formatRangeFun(newRange.slice(), props['range-key'])
    setFormatRange(range)
  }

  const _props = useRef(props)
  _props.current = props
  useImperativeHandle(ref, () => ({
    updateRange,
    getNodeInstance: () => ({
      props: _props,
      nodeRef,
      instance: {
        style: {}
      }
    })
  }))

  const onChange = (e: { detail: { value: number[] } }) => {
    const { value } = e.detail
    checkColumnChange(value)
    bindchange?.({ detail: { value: value } })
  }

  const checkColumnChange = (value: number[]) => {
    const current = valuePrev.current
    valuePrev.current = value
    const index = value.findIndex((v, i) => v !== current[i])
    if (index !== -1) {
      bindcolumnchange?.(index, value[index])
    }
  }

  const renderColumn = (columnData: any[], index: number) => {
    return (
      // @ts-expect-error ignore
      <MpxPickerViewColumn key={index}>
        {columnData.map((item, index) => (
          <Text key={index} style={styles.pickerItem}>{item}</Text>
        ))}
      </MpxPickerViewColumn>
    )
  }

  return (
    <MpxPickerView
      style={styles.pickerContainer}
      indicator-style={styles.pickerIndicator}
      value={value}
      bindchange={onChange}
    >
      {formatRange.map((item, index) => (
        renderColumn(item, index)
      ))}
    </MpxPickerView>)
})

PickerMultiSelector.displayName = 'MpxPickerMultiSelector'
export default PickerMultiSelector
