import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MpxPickerView from '../mpx-picker-view'
import MpxPickerViewColumn from '../mpx-picker-view-column'
import { DateProps } from './type'
import { HandlerRef } from '../useNodesRef'
import { extendObject, useUpdateEffect } from '../utils'
import { years, months, daysInMonth, daysInMonthLength, START_YEAR, END_YEAR } from './dateData'

type FormatObj = {
  indexArr: number[]
  rangeArr: string[][]
  nameArr?: string[]
}

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

const findIndex = (arr: string[], val: string) => {
  const res = arr.findIndex(item => item === val)
  return res === -1 ? 0 : res
}

const getColumnLength = (fields: DateProps['fields'] = 'day') => {
  return fields === 'year' ? 1 : fields === 'month' ? 2 : 3
}

const splitDateStr = (dateStr: string) => {
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth() + 1
  const todayDay = today.getDate()
  const [y, m, d] = dateStr.split('-').map(Number)
  const year = Math.min(Math.max(START_YEAR, y), END_YEAR)
  const month = Math.min(Math.max(1, m), 12)
  const day = Math.min(Math.max(1, d), daysInMonthLength(year, month))
  return [year || todayYear, month || todayMonth, day || todayDay]
}

const valueStr2Obj = (
  _value: string, // eg: 2025-2-12
  limit: number
): FormatObj => {
  const [y, m, d] = splitDateStr(_value)
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

const valueNum2String = (value: number[]) => {
  return value.map((item, index) => {
    if (index === 0) {
      return item + START_YEAR
    } else {
      return item + 1
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
  const { value = '', start = '1900-01-01', end = '2100-01-01', fields, bindchange } = props

  console.log('---> render value=', value)

  const nodeRef = useRef(null)
  const columnLength = useMemo(() => getColumnLength(fields), [fields])
  const [formatObj, setFormatObj] = useState<FormatObj>(valueStr2Obj(value, columnLength))

  useUpdateEffect(() => {
    const calibratedValue = valueStr2Obj(value, columnLength)
    setFormatObj(calibratedValue)
  }, [value, columnLength])

  const updateValue = useCallback((value: string) => {
    const calibratedValue = valueStr2Obj(value, columnLength)
    setFormatObj(calibratedValue)
  }, [columnLength])

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
    console.log('----> onChange value=', value, newObj.indexArr)
    if (hasDiff(currentValue, value, columnLength)) {
      setFormatObj(newObj)
    }
    bindchange?.({ detail: { value: valueNum2String(newObj.indexArr) } })
  }, [formatObj, columnLength, bindchange])

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
