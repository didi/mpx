import { View, Text, TouchableWithoutFeedback } from 'react-native'
import AntDatePicker from '@ant-design/react-native/lib/date-picker'
import { DatePickerPropsType } from '@ant-design/react-native/lib/date-picker/PropsType'
import React, { forwardRef, useState, useRef, useEffect } from 'react'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数
import { TimeProps, LayoutType } from './type'

function formatTimeStr(time = ''): Date {
  const now = new Date()
  let [hour, minute]: any = time.split(':')
  hour = ~~hour
  minute = ~~minute
  now.setHours(hour, minute)
  return now
}


const _TimePicker = forwardRef<HandlerRef<View, TimeProps>, TimeProps>((props: TimeProps, ref): React.JSX.Element => {
  const { children, start, end, value, bindchange, bindcancel, disabled } = props
  const [timevalue, setTimeValue] = useState(value)
  // 存储layout布局信息
  const layoutRef = useRef({})
  const { nodeRef: viewRef } = useNodesRef<View, TimeProps>(props, ref, {
  })

  useEffect(() => {
    value && setTimeValue(value)
  }, [value])

  const onChange = (date: Date): void => {
    const hh: string = ('0' + date.getHours()).slice(-2)
    const mm: string = ('0' + date.getMinutes()).slice(-2)
    const value = `${hh}:${mm}`
    setTimeValue(value)
    bindchange && bindchange({ detail: { value } })
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
 const timeProps = {
  value: formatTimeStr(timevalue),
  precision: 'minute',
  minDate: formatTimeStr(start),
  maxDate: formatTimeStr(end),
  onChange: onChange,
  onDismiss: onDismiss,
  disabled: disabled
 } as DatePickerPropsType

 const touchProps = {
  onLayout: onElementLayout,
  ref: viewRef
}
  return (
    <AntDatePicker {...timeProps}>
      <TouchableWithoutFeedback>
        <View {...touchProps}>{children}</View>
      </TouchableWithoutFeedback>
    </AntDatePicker>
  )
})

_TimePicker.displayName = 'mpx-picker-time'

export default _TimePicker

