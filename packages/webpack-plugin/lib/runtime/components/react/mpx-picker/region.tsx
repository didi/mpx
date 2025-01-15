import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MpxPickerView from '../mpx-picker-view'
import MpxPickerViewColumn from '../mpx-picker-view-column'
import { RegionProps } from './type'
import { regionData } from './regionData'
import { HandlerRef } from '../useNodesRef' // 引入辅助函数
import { extendObject, useUpdateEffect } from '../utils'

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

const rangeProvince = regionData.map(item => item.value)

const findIndex = (arr: string[], val: string) => {
  const res = arr.findIndex(item => item === val)
  return res === -1 ? 0 : res
}

const getColumnLength = (level: RegionProps['level']) => {
  if (level === 'province') {
    return 1
  } else if (level === 'city') {
    return 2
  } else {
    return 3
  }
}

type FormatObj = {
  indexArr: number[]
  rangeArr: string[][]
  nameArr?: string[]
}

const valueStr2Obj = (
  value: string[],
  limit: number,
  customItem = ''
): FormatObj => {
  const indexProvince = findIndex(rangeProvince, value[0])
  const ans: FormatObj = {
    indexArr: [indexProvince],
    rangeArr: [rangeProvince]
  }
  for (
    let i = 1,
      lastIndex = indexProvince,
      lastData = regionData,
      lastRange = rangeProvince;
    i < limit;
    i++
  ) {
    lastData = lastData[lastIndex].children!
    lastRange = lastData.map((item) => item.value)
    lastIndex = findIndex(lastRange, value[i])
    ans.indexArr.push(lastIndex)
    ans.rangeArr.push(lastRange)
  }
  return ans
}

const valueChanged2Obj = (currentObj: FormatObj, value: number[], limit = 3) => {
  const newValue = new Array(limit).fill(0)
  const currentValue = currentObj.indexArr
  for (let i = 0; i < limit; i++) {
    if (i === limit - 1) {
      return {
        indexArr: value,
        rangeArr: currentObj.rangeArr
      }
    }
    if (currentValue[i] !== value[i]) {
      newValue[i] = value[i]
      break
    }
  }

  const ans: FormatObj = {
    indexArr: [newValue[0]],
    rangeArr: [rangeProvince]
  }
  let data = regionData
  for (let i = 1; i < limit; i++) {
    data = data[newValue[i - 1]].children!
    const range = data.map(item => item.value)
    ans.indexArr.push(newValue[i])
    ans.rangeArr.push(range)
  }
  return ans
}

const valueNum2String = (value: number[]) => {
  let data = regionData
  return value.map(index => {
    const item = data[index]
    data = item.children!
    return item.value
  })
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
    HandlerRef<View, RegionProps>,
    RegionProps
>((props: RegionProps, ref): React.JSX.Element => {
  const { value = [], level = 'region', 'custom-item': customItem = '', bindchange } = props

  const nodeRef = useRef(null)
  const columnLength = useMemo(() => getColumnLength(level), [level])
  const [formatObj, setFormatObj] = useState<FormatObj>(valueStr2Obj(value, columnLength, customItem))

  useUpdateEffect(() => {
    const calibratedValue = valueStr2Obj(value, columnLength, customItem)
    setFormatObj(calibratedValue)
  }, [value, columnLength, customItem])

  const updateValue = useCallback((value: string[]) => {
    const calibratedValue = valueStr2Obj(value, columnLength, customItem)
    setFormatObj(calibratedValue)
  }, [columnLength, customItem])

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
            const len = item.length
            const style = extendObject({}, styles.pickerItem, {
              fontSize: len > 5 ? 21 - len : 16
            })
            return <Text key={index} style={style}>
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
