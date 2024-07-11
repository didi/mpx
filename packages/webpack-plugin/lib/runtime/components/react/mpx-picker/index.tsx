import { View, Text } from 'react-native'
import React, { forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
import useInnerProps, { getCustomEvent } from '../getInnerListeners'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数
import Selector from './selector'
import TimeSelector from './time'
import DateSelector from './date'
import MultiSelector from './multiSelector'
import RegionSelector from './region'
import { PickerProps, EventType } from './type'


const _Picker = forwardRef<HandlerRef<View, PickerProps>, PickerProps>((props: PickerProps, ref): React.JSX.Element => {
  const { mode = 'selector', value, bindcancel, bindchange, children } = props
  let innerLayout = useRef({})
  const { nodeRef } = useNodesRef<View, PickerProps>(props, ref, {
  })
  const innerProps = useInnerProps(props, {
    ref: nodeRef
  }, [], { layoutRef: innerLayout })

  const getInnerLayout = (layout: React.MutableRefObject<{}>) => {
    innerLayout.current = layout.current
  }

  const onChange = (event: EventType) => {
    const eventData = getCustomEvent('change', {}, { detail: event.detail, layoutRef: innerLayout })
    bindchange && bindchange(eventData)
  }

  const commonProps = {
    ...{innerProps},
    mode,
    value,
    children,
    bindchange: onChange,
    bindcancel,
    getInnerLayout
  }

  const selectorProps = {
    ...commonProps,
    range: props['range'],
    'range-key': props['range-key']
  }

  const timeProps = {
    ...commonProps,
    start: props['start'],
    end: props['end']
  }

  const dateProps = {
    ...commonProps,
    start: props['start'],
    end: props['end'],
    fileds: props.fields || 'day'
  }

  const regionProps = {
    ...commonProps,
    level: props.level || 'sub-district'
  }

  if (mode === 'selector') {
    return <Selector {...selectorProps}></Selector>
  } else if (mode === 'multiSelector') {
    return <MultiSelector {...selectorProps}></MultiSelector>
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

_Picker.displayName = 'mpx-picker';

export default _Picker
