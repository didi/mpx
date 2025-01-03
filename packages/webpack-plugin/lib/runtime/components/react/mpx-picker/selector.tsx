/**
 * 普通选择器，range可以是Array<Obj> 也可以是Array
 */
import { StyleSheet, Text, View } from 'react-native'
import React, { forwardRef, useRef } from 'react'
import { SelectorProps, Obj, RangeItem } from './type'
import MpxPickerView from '../mpx-picker-view'
import MpxPickerViewColumn from '../mpx-picker-view-column'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数

const styles = StyleSheet.create({
  pickerContainer: {
    height: 265
  },
  pickerItem: {
    lineHeight: 40,
    textAlign: 'center'
  }
})

const formatRangeFun = (range: RangeItem[], rangeKey = '') =>
  rangeKey ? range.map((item: Obj) => item[rangeKey]) : range

const formatValue = (value: number | number[]) => {
  const _value = Array.isArray(value) ? value[0] : value
  return +_value
}

const PickerSelector = forwardRef<
    HandlerRef<View, SelectorProps>,
    SelectorProps
>((props: SelectorProps, ref): React.JSX.Element => {
  const { range = [], bindchange } = props
  const value = formatValue(props.value ?? 0)
  const formatRange: Array<any> = formatRangeFun(range, props['range-key'])
  const nodeRef = useRef(null)

  useNodesRef(props, ref, nodeRef, { style: {} })

  const onChange = (e: { detail: { value: number[] } }) => {
    const { value } = e.detail
    bindchange?.({ detail: { value: value[0] + '' } })
  }

  return (
    <MpxPickerView
      style={styles.pickerContainer}
      indicator-style="height: 40"
      value={[value]}
      bindchange={onChange}
    >
      {/* @ts-expect-error ignore */}
      <MpxPickerViewColumn>
        {formatRange.map((item, index) => (
          <Text key={index} style={styles.pickerItem}>{item}</Text>
        ))}
      </MpxPickerViewColumn>
    </MpxPickerView>)
})

PickerSelector.displayName = 'MpxPickerSelector'
export default PickerSelector
