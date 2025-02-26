import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SelectorProps, Obj, RangeItem } from './type'
import MpxPickerView from '../mpx-picker-view'
import MpxPickerViewColumn from '../mpx-picker-view-column'
import { HandlerRef } from '../useNodesRef'
import { useUpdateEffect } from '../utils'

const styles = StyleSheet.create({
  pickerContainer: {
    height: 240,
    paddingHorizontal: 10,
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

const formatValueFn = (value: number | number[] = 0) => {
  const _value = Array.isArray(value) ? value[0] : value
  return +_value
}

const PickerSelector = forwardRef<
  HandlerRef<View, SelectorProps>,
  SelectorProps
>((props: SelectorProps, ref): React.JSX.Element => {
  const { value, range = [], bindchange } = props
  const [formatValue, setFormatValue] = useState<number>(formatValueFn(value))
  const formatRange: Array<any> = formatRangeFun(range, props['range-key'])
  const nodeRef = useRef(null)

  const updateValue = (value = 0) => {
    const newValue = formatValueFn(value)
    setFormatValue(newValue)
  }

  useUpdateEffect(() => {
    updateValue(value)
  }, [value])

  const _props = useRef(props)
  _props.current = props
  useImperativeHandle(ref, () => ({
    updateValue,
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
    if (formatValue !== value[0]) {
      setFormatValue(value[0])
    }
    bindchange?.({ detail: { value: value[0] + '' } })
  }

  return (
    <MpxPickerView
      style={styles.pickerContainer}
      indicator-style={styles.pickerIndicator}
      value={[formatValue]}
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
