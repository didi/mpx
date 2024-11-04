import { View } from 'react-native'
// import { PickerValue } from '@ant-design/react-native'
import React, { forwardRef, useRef, useContext, useState } from 'react'
import { warn } from '@mpxjs/utils'
import useInnerProps, { getCustomEvent } from '../getInnerListeners'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数
import Selector from './selector'
import TimeSelector from './time'
import DateSelector from './date'
import MultiSelector from './multiSelector'
import RegionSelector from './region'
import { PickerProps, EventType, ValueType } from './type'
import { FormContext, FormFieldValue } from '../context'

/**
 * ✔ mode
 * ✔ disabled
 * ✔ bindcancel
 * ✔ bindchange
 * ✔ range
 * ✔ range-key
 * ✔ value
 * ✔ start
 * ✔ end
 * ✔ fields 有效值 year,month,day，表示选择器的粒度
 * ✔ end
 * ✔ custom-item
 * ✔ level 选择器层级 province，city，region，<sub-district不支持>
 * ✔ level
 * ✘ header-text
 * ✘ bindcolumnchange
 */

const _Picker = forwardRef<HandlerRef<View, PickerProps>, PickerProps>((props: PickerProps, ref): React.JSX.Element => {
  const { mode = 'selector', value, bindcancel, bindchange, children, bindcolumnchange } = props
  const innerLayout = useRef({})
  const nodeRef = useRef(null)
  useNodesRef<View, PickerProps>(props, ref, nodeRef, {
  })
  const innerProps = useInnerProps(props, {
    ref: nodeRef
  }, [], { layoutRef: innerLayout })

  const [pickerValue, setPickerValue] = useState(value as ValueType)
  const defaultValues = {
    selector: 0,
    multiSelector: [0],
    time: props.start,
    date: props.start,
    region: undefined
  }

  const formContext = useContext(FormContext)

  let formValuesMap: Map<string, FormFieldValue> | undefined

  // 判断 context 是否存在，存在的话读取 context 中存的 formValuesMap
  if (formContext) {
    formValuesMap = formContext.formValuesMap
  }

  const resetValue = () => {
    type curMode = keyof typeof defaultValues
    const defalutValue = (defaultValues[mode as curMode] !== undefined ? defaultValues[mode as curMode] : value) as ValueType
    setPickerValue(defalutValue)
  }

  const getValue = () => {
    return pickerValue
  }
  if (formValuesMap) {
    if (!props.name) {
      warn('If a form component is used, the name attribute is required.')
    } else {
      formValuesMap.set(props.name, { getValue, resetValue })
    }
  }

  const getInnerLayout = (layout: React.MutableRefObject<{}>) => {
    innerLayout.current = layout.current
  }

  const onChange = (event: EventType) => {
    const eventData = getCustomEvent('change', {}, { detail: event.detail, layoutRef: innerLayout })
    bindchange && bindchange(eventData)
    setPickerValue(event.detail.value as ValueType)
  }

  const columnChange = (value: any[], index: number) => {
    // type: "columnchange", detail: {column: 1, value: 2}
    const eventData = getCustomEvent('columnchange', {}, { detail: { column: index, value }, layoutRef: innerLayout })
    bindcolumnchange && bindcolumnchange(eventData)
  }
  const commonProps = {
    ...{ innerProps },
    mode,
    children,
    bindchange: onChange,
    bindcolumnchange: columnChange,
    bindcancel,
    getInnerLayout
  }

  const selectorProps = {
    ...commonProps,
    value: pickerValue as any,
    range: props.range,
    'range-key': props['range-key']
  }

  const multiProps = {
    ...commonProps,
    value: pickerValue as Array<number>,
    range: props.range,
    'range-key': props['range-key']
  }

  const timeProps = {
    ...commonProps,
    value: pickerValue as string,
    start: props.start,
    end: props.end
  }

  const dateProps = {
    ...commonProps,
    value: pickerValue as string,
    start: props.start,
    end: props.end,
    fileds: props.fields || 'day'
  }

  const regionProps = {
    ...commonProps,
    value: pickerValue as Array<string>,
    level: props.level || 'sub-district'
  }

  if (mode === 'selector') {
    return <Selector {...selectorProps}></Selector>
  } else if (mode === 'multiSelector') {
    return <MultiSelector {...multiProps}></MultiSelector>
  } else if (mode === 'time') {
    return <TimeSelector {...timeProps}></TimeSelector>
  } else if (mode === 'date') {
    return <DateSelector {...dateProps}></DateSelector>
  } else if (mode === 'region') {
    return <RegionSelector {...regionProps}></RegionSelector>
  } else {
    return <View>只支持selector, multiSelector, time, date, region 这些类型</View>
  }
})

_Picker.displayName = 'mpx-picker'

export default _Picker
