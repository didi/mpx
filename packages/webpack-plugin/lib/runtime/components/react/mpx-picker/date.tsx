import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MpxPickerView from '../mpx-picker-view'
import MpxPickerViewColumn from '../mpx-picker-view-column'
import { DateProps, TimeValue } from './type'
import { HandlerRef } from '../useNodesRef'
import { useUpdateEffect } from '../utils'
import { years, months, daysInMonth, wrapDate, daysInMonthLength, START_YEAR, END_YEAR } from './dateData'

type FormatObj = {
  indexArr: number[]
  rangeArr: string[][]
  nameArr?: string[]
}

const START_DATE: TimeValue = `${START_YEAR}-01-01`
const END_DATE: TimeValue = `${END_YEAR}-12-31`
const START_DATE_ARR = [START_YEAR, 1, 1]
const END_DATE_ARR = [END_YEAR, 12, 31]

const styles = StyleSheet.create({
  pickerContainer: {
    height: 240,
    paddingHorizontal: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  },
  pickerIndicator: {
    height: 45
  },
  pickerItem: {
    fontSize: 16,
    lineHeight: 45,
    textAlign: 'center'
  }
})

const getColumnLength = (fields: DateProps['fields'] = 'day') => {
  return fields === 'year' ? 1 : fields === 'month' ? 2 : 3
}

const compareDateStr = (date1: TimeValue | number[], date2: TimeValue | number[]) => {
  const [y1 = START_YEAR, m1 = 0, d1 = 0] = typeof date1 === 'string' ? date1.split('-').map(Number) : date1
  const [y2 = START_YEAR, m2 = 0, d2 = 0] = typeof date2 === 'string' ? date2.split('-').map(Number) : date2
  const num1 = y1 * 10000 + m1 * 100 + d1
  const num2 = y2 * 10000 + m2 * 100 + d2
  if (num1 === num2) {
    return 0
  }
  return num1 > num2 ? 1 : -1
}

const getDateArr = (date: TimeValue | number[]): number[] => {
  const [y, m, d] = typeof date === 'string' ? date.split('-').map(Number) : date
  return [y || 0, m || 0, d || 0]
}

const calibrateDate = (date: TimeValue | number[], start: TimeValue, end: TimeValue): number[] => {
  let startArr = getDateArr(start)
  let endArr = getDateArr(end)
  let dateArr = getDateArr(date)
  if (compareDateStr(startArr, endArr) > 0) {
    startArr = START_DATE_ARR
  }
  if (compareDateStr(endArr, startArr) < 0) {
    endArr = END_DATE_ARR
  }
  if (compareDateStr(start, end) > 0) {
    startArr = START_DATE_ARR
    endArr = END_DATE_ARR
  }
  if (compareDateStr(dateArr, endArr) > 0) {
    dateArr = endArr
  }
  if (compareDateStr(dateArr, startArr) < 0) {
    dateArr = startArr
  }
  return dateArr
}

const initDateStr2Arr = (dateStr: TimeValue | number[], start: TimeValue, end: TimeValue): number[] => {
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth() + 1
  const todayDay = today.getDate()
  const [y, m, d] = getDateArr(dateStr)
  const year = Math.min(Math.max(START_YEAR, y), END_YEAR)
  const month = Math.min(Math.max(1, m), 12)
  const day = Math.min(Math.max(1, d), daysInMonthLength(year, month))
  const res = [year || todayYear, month || todayMonth, day || todayDay]
  return calibrateDate(res, start, end)
}

const valueStr2Obj = (
  _value: TimeValue | number[], // eg: 2025-2-12
  limit: number,
  start: TimeValue,
  end: TimeValue
): FormatObj => {
  const [y, m, d] = initDateStr2Arr(_value, start, end)
  const ans = {
    indexArr: [y - START_YEAR],
    rangeArr: [years]
  }
  if (limit === 2) {
    ans.indexArr.push(m - 1)
    ans.rangeArr.push(months)
  } else if (limit === 3) {
    const days = daysInMonth(y, m)
    ans.indexArr.push(m - 1, d - 1)
    ans.rangeArr.push(months, days)
  }
  return ans
}

const valueChanged2Obj = (currentObj: FormatObj, value: number[], limit = 3) => {
  const currentValue = currentObj.indexArr
  const rangeArr = currentObj.rangeArr

  if (limit === 3 && (currentValue[0] !== value[0] || currentValue[1] !== value[1])) {
    const days = daysInMonth(value[0], value[1] + 1)
    rangeArr[2] = days
  }

  return {
    indexArr: value,
    rangeArr
  }
}

const valueChanged2Obj2 = (value: number[], limit = 3, start: TimeValue, end: TimeValue) => {
  const y = value[0] + START_YEAR
  const m = value[1] + 1
  const d = value[2] + 1
  return valueStr2Obj([y, m, d], limit, start, end)
}

const valueNum2String = (value: number[]) => {
  return value.map((item, index) => {
    if (index === 0) {
      return item + START_YEAR
    } else {
      return wrapDate()(item + 1)
    }
  }).join('-')
}

const hasDiff = (currentValue: number[], value: number[], limit = 3) => {
  for (let i = 0; i < limit; i++) {
    if (currentValue[i] !== value[i]) {
      return true
    }
  }
  return false
}

const PickerTime = forwardRef<
  HandlerRef<View, DateProps>,
  DateProps
>((props: DateProps, ref): React.JSX.Element => {
  const { value = '', start = START_DATE, end = END_DATE, fields, bindchange } = props

  const nodeRef = useRef(null)
  const columnLength = useMemo(() => getColumnLength(fields), [fields])
  const [formatObj, setFormatObj] = useState<FormatObj>(valueStr2Obj(value, columnLength, start, end))
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current)
    }
  }, [])

  useUpdateEffect(() => {
    const calibratedValue = valueStr2Obj(value, columnLength, start, end)
    setFormatObj(calibratedValue)
  }, [value, columnLength, start, end])

  const updateValue = useCallback((value: TimeValue) => {
    const calibratedValue = valueStr2Obj(value, columnLength, start, end)
    setFormatObj(calibratedValue)
  }, [columnLength, start, end])

  const _props = useRef(props)
  _props.current = props
  useImperativeHandle(ref, () => ({
    updateValue,
    getNodeInstance: () => ({
      props: _props,
      nodeRef,
      instance: {
        style: {}
      }
    })
  }))

  const onChange = useCallback((e: { detail: { value: number[] } }) => {
    const { value } = e.detail
    const currentValue = formatObj.indexArr
    const newObj = valueChanged2Obj(formatObj, value, columnLength)
    console.log('---> data change', newObj.indexArr)
    if (hasDiff(currentValue, value, columnLength)) {
      setFormatObj(newObj)
      const newObj2 = valueChanged2Obj2(value, columnLength, start, end)
      timerRef.current && clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setFormatObj(newObj2))
    }
    bindchange?.({ detail: { value: valueNum2String(newObj.indexArr) } })
  }, [formatObj, columnLength, bindchange, start, end])

  const renderColumn = () => {
    return formatObj.rangeArr?.map((item, index) => (
      // @ts-expect-error ignore
      <MpxPickerViewColumn key={index}>
        {item.map((item, index) => {
          return <Text key={index} style={styles.pickerItem}>
            {item}
          </Text>
        })}
      </MpxPickerViewColumn>
    ))
  }

  return (
    <MpxPickerView
      style={styles.pickerContainer}
      indicator-style={styles.pickerIndicator}
      value={formatObj.indexArr}
      bindchange={onChange}
    >
      {renderColumn()}
    </MpxPickerView>)
})

PickerTime.displayName = 'MpxPickerTime'
export default PickerTime
