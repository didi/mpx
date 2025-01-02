/**
 * 普通选择器，range可以是Array<Obj> 也可以是Array
 */
import { Text, TouchableWithoutFeedback, View } from 'react-native'
import React, { forwardRef, useRef } from 'react'
import { SelectorProps, Obj } from './type'
import MpxPickerView from '../mpx-picker-view'
import MpxPickerViewColumn from '../mpx-picker-view-column'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数
import { extendObject } from '../utils'
import { usePopup } from '../mpx-popup'

type RangeItemType = Obj | number | string

const formatRangeFun = (range: RangeItemType[], rangeKey = '') =>
  rangeKey ? range.map((item: Obj) => item[rangeKey]) : range

const formatValue = (value: number | number[]) => {
  const _value = Array.isArray(value) ? value[0] : value
  return +_value
}

const { open, remove } = usePopup()

const _SelectorPicker = forwardRef<
    HandlerRef<View, SelectorProps>,
    SelectorProps
>((props: SelectorProps, ref): React.JSX.Element => {
  const {
    range,
    style = {},
    children,
    disabled,
    bindchange,
    bindcancel
  } = props

  const value = formatValue(props.value ?? 0)
  console.log('[mpx-picker-selector], render ---> value=', props.value, 'formatValue=', value)

  const formatRange: Array<any> = formatRangeFun(range, props['range-key'])
  const nodeRef = useRef(null)
  useNodesRef(props, ref, nodeRef, { style })

  const onChange = (e: { detail: { value: number[] } }) => {
    const { value } = e.detail
    console.log('[mpx-picker-selector], onChange ---> value=', value)
    bindchange?.({ detail: { value: value[0] + '' } })
  }

  const wrapperStyle = extendObject(style, {
    height: 300
  })

  const renderPickerView = () => (
      <MpxPickerView
        style={wrapperStyle}
        indicator-style="height: 40"
        value={[value]}
        bindchange={onChange}
      >
        {/* @ts-expect-error ignore */}
        <MpxPickerViewColumn>
          {formatRange.map((item, index) => (
            <Text key={index} style={{ lineHeight: 40, textAlign: 'center' }}>{item}</Text>
          ))}
        </MpxPickerViewColumn>
      </MpxPickerView>
  )

  const openPicker = () => {
    console.log('openPicker 被触发')
    open(renderPickerView())
  }

  return (
    <TouchableWithoutFeedback onPress={openPicker}>
      {children}
    </TouchableWithoutFeedback>
  )
})

_SelectorPicker.displayName = 'MpxPickerSelector'
export default _SelectorPicker
