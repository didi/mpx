/**
 * All:
 *   ✔ value
 *   ✔ onChange
 *   ✔ onCancel
 * Selector:
 *   ✔ range
 *   ✔ rangeKey
 *   ✔ disabled
 * MultiSelector:
 *   ✔ range
 *   ✔ rangeKey
 *   ✔ disabled
 *   ✔ onColumnChange
 * Time:
 *   ✔ start
 *   ✔ end
 *   ✔ disabled
 * Date:
 *   ✔ start
 *   ✔ end
 *   ✘ fields
 *   ✔ disabled
 * Region:
 *   ✔ customItem
 *   ✔ disabled
 *
 * @hint Picker 里面嵌套的子组件要支持绑定 onPress 事件才能弹出选择框
 */
// https://rn.mobile.ant.design/docs/react/introduce-cn
import { View, Text } from 'react-native'
import React, { forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
import useInnerProps from '../getInnerListeners'
import { getCustomEvent } from '../getInnerListeners'
import useNodesRef, { HandlerRef } from '../../../useNodesRef' // 引入辅助函数
import Selector from './selector'
import TimeSelector from './time'
import DateSelector from './date'
import MultiSelector from './multiSelector'
import RegionSelector from './region'
import { PickerProps } from './type'


const _Picker = forwardRef<HandlerRef<View, PickerProps>, PickerProps>((props: PickerProps, ref): React.JSX.Element => {
  const { mode = 'selector', value, bindcancel, bindchange, children } = props
  const commonProps = {
    mode,
    value,
    children,
    bindchange,
    bindcancel
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
