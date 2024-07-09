import { View, Text, TouchableWithoutFeedback } from 'react-native'
import AntDatePicker from '@ant-design/react-native/lib/date-picker'
import React, { forwardRef, useState, useRef, useEffect } from 'react'
import useNodesRef, { HandlerRef } from '../../../useNodesRef' // 引入辅助函数
import { DateProps } from './type'

function formatTimeStr(time = ''): Date {
  let [year, month, day]: any = time.split('-')
  year = ~~year || 2000
  month = ~~month || 1
  day = ~~day || 1
  return new Date(year, month - 1, day)
}

function dateToString (date: Date, fields: 'day' | 'month' | 'year' = 'day'): string {
  const yyyy: string = date.getFullYear() + ''
  const MM: string = ('0' + (date.getMonth() + 1)).slice(-2)
  const dd: string = ('0' + date.getDate()).slice(-2)
  let ret: string = yyyy
  if (fields === 'month' || fields === 'day') {
    ret += `-${MM}`
    if (fields === 'day') {
      ret += `-${dd}`
    }
  }
  return ret
}


const _DatePicker = forwardRef<HandlerRef<View, DateProps>, DateProps>((props: DateProps, ref):  React.JSX.Element => {
  const { children, start = '1970-01-01', end = '2999-01-01', value, bindchange, bindcancel, disabled, fields } = props
  const [datevalue, setDateValue] = useState(value)

  useEffect(() => {
    value && setDateValue(value)
  }, [value])

  const onChange = (date: Date): void => {
    const { fields = 'day' } = props
    const ret = dateToString(date, fields)
    setDateValue(ret)
    bindchange && bindchange({ detail: { value: ret } })
  }

  const onDismiss = (): void => {
    bindcancel && bindcancel()
  }

  const dateProps = {
    precision: fields,
    value: formatTimeStr(datevalue),
    minDate: formatTimeStr(start),
    maxDate: formatTimeStr(end),
    onChange,
    onDismiss,
    disabled
  }
  return (
    <AntDatePicker {...dateProps}>
      <TouchableWithoutFeedback>
        {children}
      </TouchableWithoutFeedback>
    </AntDatePicker>
  )
})

_DatePicker.displayName = 'mpx-picker-date'
export default _DatePicker
