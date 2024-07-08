import { View, Text, TouchableWithoutFeedback } from 'react-native'
import AntDatePicker from '@ant-design/react-native/lib/date-picker'
import React, { forwardRef, useState, useRef, useEffect } from 'react'
import useNodesRef, { HandlerRef } from '../../../useNodesRef' // 引入辅助函数
import { TimeProps } from './type'

function formatTimeStr(time = ''): Date {
  const now = new Date()
  let [hour, minute]: any = time.split(':')
  hour = ~~hour
  minute = ~~minute
  now.setHours(hour, minute)
  return now
}


const _TimePicker = forwardRef<HandlerRef<View, TimeProps>, TimeProps>((props: TimeProps, ref) => {
  const { children, start, end, value, bindchange, bindcancel, disabled } = props
  const [timevalue, setTimeValue] = useState(value)

  useEffect(() => {
    value && setTimeValue(value)
  }, [value])

  const onChange = (date: Date): void => {
    const hh: string = ('0' + date.getHours()).slice(-2)
    const mm: string = ('0' + date.getMinutes()).slice(-2)
    const value = `${hh}:${mm}`
    console.log('-----------------------------33333333------', value)
    setTimeValue(value)
    bindchange && bindchange({ detail: { value } })
  }

  const onDismiss = (): void => {
    bindcancel && bindcancel()
  }
  /*
  const renderLabel = (type, data) => {
    console.log('-------------------renderLable', type, data)
    let arrElement = []
    if (type === 'hour') {
      arrElement.push(<Text>{data}</Text>)
    } else if (type === 'minute') {
      arrElement.push(<Text>{data}</Text>)
    }
    return <View>{arrElement}</View>
  }
  */
  console.log('--------------------time--', timevalue, start, end, formatTimeStr(start), formatTimeStr(end))
  return (
    <AntDatePicker
      value={formatTimeStr(timevalue)}
      precision={'minute'}
      minDate={formatTimeStr(start)}
      maxDate={formatTimeStr(end)}
      onChange={onChange}
      onDismiss={onDismiss}
      disabled={disabled}
    >
      <TouchableWithoutFeedback>{children}</TouchableWithoutFeedback>
    </AntDatePicker>
  )
})

_TimePicker.displayName = 'mpx-picker-time'

export default _TimePicker

