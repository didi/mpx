import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { RegionProps } from './type'
import { regionData } from './regionData'
import MpxPickerView from '../mpx-picker-view'
import MpxPickerViewColumn from '../mpx-picker-view-column'
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

const provinceMap = regionData.map(item => item.value)

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
  level: RegionProps['level'] = 'region',
  customItem = ''
): FormatObj => {
  const indexProvince = findIndex(provinceMap, value[0])
  const dataCity = regionData[indexProvince].children!
  const rangeCity = dataCity.map(item => item.value)
  const indexCity = findIndex(rangeCity, value[1])
  const dataArea = dataCity[indexCity].children!
  const rangeArea = dataArea.map(item => item.value)
  const indexArea = findIndex(rangeArea, value[2])

  return {
    indexArr: [indexProvince, indexCity, indexArea],
    rangeArr: [provinceMap, rangeCity, rangeArea]
  }
}

const valueChanged2Obj = (currentObj: FormatObj, value: number[]) => {
  let [indexProvince, indexCity, indexArea] = currentObj.indexArr
  const [newIndexProvince, newIndexCity, newIndexArea] = value
  if (indexProvince !== newIndexProvince) {
    indexProvince = newIndexProvince
    indexCity = 0
    indexArea = 0
  } else if (indexCity !== newIndexCity) {
    indexCity = newIndexCity
    indexArea = 0
  } else if (indexArea !== newIndexArea) {
    return {
      indexArr: value,
      rangeArr: currentObj.rangeArr
    }
  }

  const dataCity = regionData[indexProvince].children!
  const rangeCity = dataCity.map(item => item.value)
  const dataArea = dataCity[indexCity].children!
  const rangeArea = dataArea.map(item => item.value)
  return {
    indexArr: [indexProvince, indexCity, indexArea],
    rangeArr: [provinceMap, rangeCity, rangeArea]
  }
}

const valueNum2String = (value: number[]) => {
  const province = regionData[value[0]]
  const city = province.children![value[1]]
  const area = city.children![value[2]]
  return [province.value, city.value, area.value]
}

const hasDiff = (currentValue: number[], value: number[]) => {
  return currentValue[0] !== value[0] || currentValue[1] !== value[1] || currentValue[2] !== value[2]
}

const PickerTime = forwardRef<
    HandlerRef<View, RegionProps>,
    RegionProps
>((props: RegionProps, ref): React.JSX.Element => {
  const { value = [], level = 'region', 'custom-item': customItem = '', bindchange } = props
  console.log('[mpx-picker-time] --->', 'value', value)

  const nodeRef = useRef(null)
  const [formatObj, setFormatObj] = useState<FormatObj>(valueStr2Obj(value, level))

  useUpdateEffect(() => {
    const calibratedValue = valueStr2Obj(value, level, customItem)
    setFormatObj(calibratedValue)
  }, [value])

  const updateValue = (value: string[]) => {
    const calibratedValue = valueStr2Obj(value, level, customItem)
    setFormatObj(calibratedValue)
  }

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

  const onChange = (e: { detail: { value: number[] } }) => {
    const { value } = e.detail
    const currentValue = formatObj.indexArr
    const newObj = valueChanged2Obj(formatObj, value)
    if (hasDiff(currentValue, value)) {
      setFormatObj(newObj)
    }
    bindchange?.({ detail: { value: valueNum2String(newObj.indexArr) } })
  }

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
