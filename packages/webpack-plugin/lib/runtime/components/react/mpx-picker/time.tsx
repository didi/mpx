import React, { forwardRef, useRef, useState, useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { warn } from '@mpxjs/utils'
import { TimeProps } from './type'
import MpxPickerView from '../mpx-picker-view'
import MpxPickerViewColumn from '../mpx-picker-view-column'
import useNodesRef, { HandlerRef } from '../useNodesRef'
import { useUpdateEffect } from '../utils'

const styles = StyleSheet.create({
  pickerContainer: {
    width: 120,
    height: 240,
    alignSelf: 'center',
    paddingHorizontal: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  },
  pickerIndicator: {
    height: 45
  },
  pickerItem: {
    fontSize: 20,
    lineHeight: 45,
    textAlign: 'center'
  }
})

type Hour = number
type Minute = number
type TimeArray = [Hour, Minute]

const time2Array = (time: string, defaultValue: TimeArray = [0, 0]): TimeArray => {
  if (typeof time !== 'string') {
    warn('[mpx runtime warn]: mpx-picker prop time must be a string')
    return defaultValue
  }
  let [hour = 0, minute = 0] = time.split(':').map(Number)
  hour = Math.min(Math.max(hour, 0), 23)
  minute = Math.min(Math.max(minute, 0), 59)
  return [hour, minute]
}

const time2String = (time: TimeArray): string => {
  return time.map(i => i.toString().padStart(2, '0')).join(':')
}

const time2Minutes = (time: TimeArray): number => {
  return time[0] * 60 + time[1]
}

const calibrateTime = (
  time: string | TimeArray,
  start: string | TimeArray = [0, 0],
  end: string | TimeArray = [23, 59]
): TimeArray => {
  time = typeof time === 'string' ? time2Array(time) : time
  start = typeof start === 'string' ? time2Array(start) : start
  end = typeof end === 'string' ? time2Array(end) : end
  const current = time2Minutes(time)
  if (current < time2Minutes(start)) {
    return start
  } else if (current > time2Minutes(end)) {
    return end
  } else {
    return time
  }
}

const hoursRange = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const minutesRange = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

const PickerTime = forwardRef<
  HandlerRef<View, TimeProps>,
  TimeProps
>((props: TimeProps, ref): React.JSX.Element => {
  const { value = '00:00', start = '00:00', end = '23:59', bindchange } = props

  const nodeRef = useRef(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startArray = time2Array(start)
  const endArray = time2Array(end, [23, 59])
  const [formatValue, setFormatValue] = useState<TimeArray>(calibrateTime(value, startArray, endArray))

  useNodesRef(props, ref, nodeRef, { style: {} })

  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current)
    }
  }, [])

  useUpdateEffect(() => {
    const calibratedValue = calibrateTime(value, startArray, endArray)
    setFormatValue(calibratedValue)
  }, [value])

  const onChange = (e: { detail: { value: TimeArray } }) => {
    const { value } = e.detail
    const calibratedValue = calibrateTime(value, startArray, endArray)
    bindchange?.({ detail: { value: time2String(calibratedValue) } })

    if (value[0] !== formatValue[0] || value[1] !== formatValue[1]) {
      setFormatValue(value)
    }
    if (value[0] !== calibratedValue[0] || value[1] !== calibratedValue[1]) {
      timerRef.current && clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setFormatValue(calibratedValue))
    }
  }

  return (
    <MpxPickerView
      style={styles.pickerContainer}
      indicator-style={styles.pickerIndicator}
      value={formatValue}
      bindchange={onChange}
    >
      {/* @ts-expect-error ignore */}
      <MpxPickerViewColumn key='hour'>
        {hoursRange.map((item, index) => (
          <Text key={index} style={styles.pickerItem}>{item}</Text>
        ))}
      </MpxPickerViewColumn>
      {/* @ts-expect-error ignore */}
      <MpxPickerViewColumn key='minute'>
        {minutesRange.map((item, index) => (
          <Text key={index} style={styles.pickerItem}>{item}</Text>
        ))}
      </MpxPickerViewColumn>
    </MpxPickerView>)
})

PickerTime.displayName = 'MpxPickerTime'
export default PickerTime
