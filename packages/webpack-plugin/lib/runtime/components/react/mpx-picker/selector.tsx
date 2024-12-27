/**
 * 普通选择器，range可以是Array<Obj> 也可以是Array
 */
import { Text, View } from 'react-native'
import React, { forwardRef, useRef } from 'react'
import MpxPickerView from '../mpx-picker-view'
import MpxPickerViewColumn from '../mpx-picker-view-column'
import { SelectorProps, Obj } from './type'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数
import { getCustomEvent } from '../getInnerListeners'
import { useLayout, useTransformStyle } from '../utils'

type RangeItemType = Obj | number | string

const formatRangeFun = (range: RangeItemType[], rangeKey = '') =>
  rangeKey ? range.map((item: Obj) => item[rangeKey]) : range

const _SelectorPicker = forwardRef<
    HandlerRef<View, SelectorProps>,
    SelectorProps
>((props: SelectorProps, ref): React.JSX.Element => {
  const {
    range,
    style = {},
    value = 0,
    children,
    disabled,
    bindchange,
    bindcancel,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  const formatRange: Array<any> = formatRangeFun(range, props['range-key'])

  const { hasSelfPercent, normalStyle, setWidth, setHeight } =
    useTransformStyle(style, {
      enableVar,
      externalVarContext,
      parentFontSize,
      parentWidth,
      parentHeight
    })
  const nodeRef = useRef(null)
  useNodesRef(props, ref, nodeRef, {
    style: normalStyle
  })
  const { layoutRef } = useLayout({
    props,
    hasSelfPercent,
    setWidth,
    setHeight,
    nodeRef
  })

  const onChange = (value: number) => {
    console.log('[mpx-picker-selector], onChange ---> value=', value)
    const eventData = getCustomEvent('change', {}, { detail: { value }, layoutRef })
    // bindchange?.(eventData)
  }

  return (disabled
    ? <></>
    : <MpxPickerView
        style={[style, { height: 300 }]}
        indicator-style="height: 40px"
        value={[value]}
        bindchange={onChange}
      >
        {/* @ts-expect-error ignore */}
        <MpxPickerViewColumn>
          {formatRange.map((item, index) => (
            <Text key={index}>{item}</Text>
          ))}
        </MpxPickerViewColumn>
      </MpxPickerView>
  )
})

_SelectorPicker.displayName = 'MpxPickerSelector'
export default _SelectorPicker
