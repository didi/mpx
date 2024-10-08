import { View, TouchableWithoutFeedback } from 'react-native'
import { DatePicker } from '@ant-design/react-native'
import React, { forwardRef, useState, useRef, useEffect } from 'react'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数
import { DateProps, LayoutType } from './type'

function formatTimeStr (time = ''): Date {
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

const _DatePicker = forwardRef<HandlerRef<View, DateProps>, DateProps>((props: DateProps, ref): React.JSX.Element => {
  const { children, start = '1970-01-01', end = '2999-01-01', value, bindchange, bindcancel, disabled, fields } = props
  const [datevalue, setDateValue] = useState(value)
  // 存储layout布局信息
  const layoutRef = useRef({})
  const { nodeRef: viewRef } = useNodesRef<View, DateProps>(props, ref, {
  })

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

  const onElementLayout = (layout: LayoutType) => {
    viewRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      props.getInnerLayout && props.getInnerLayout(layoutRef)
    })
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
  const touchProps = {
    onLayout: onElementLayout,
    ref: viewRef
  }
  return (
    <DatePicker {...dateProps}>
      <TouchableWithoutFeedback>
        <View {...touchProps}>{children}</View>
      </TouchableWithoutFeedback>
    </DatePicker>
  )
})

_DatePicker.displayName = 'mpx-picker-date'
export default _DatePicker
