/**
 * 普通选择器，range可以是Array<Obj> 也可以是Array
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native'
import React, { forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
import { SelectorProps } from '@mpxjs/webpack-plugin/lib/runtime/components/react/mpx-picker/type'
import useNodesRef, { HandlerRef } from '@mpxjs/webpack-plugin/lib/runtime/useNodesRef' // 引入辅助函数
import { default as PickerView } from '@mpxjs/webpack-plugin/lib/runtime/components/react/mpx-picker-view'
import { default as PickerViewColumn } from '@mpxjs/webpack-plugin/lib/runtime/components/react/mpx-picker-view-column'
import { InnerSelectorProps } from './type'

const styles: { [key: string]: Object } = {
  centeredView: {
    position: 'absolute',
    bottom: 0,
    width: "100%",
    overflow: 'scroll'
  },
  btnLine: {
    width: "100%",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    borderColor: 20,
    borderBottomWidth: 1
  },
  cancel: {
    height: 50,
    display: "flex",
    justifyContent: 'center'
  },
  ok: {
    height: 50,
    display: "flex",
    justifyContent: 'center'
  },
  oktext: {
    color: 'rgb(255, 0, 0)'
  }
}

const _SelectorPicker = forwardRef<HandlerRef<View, InnerSelectorProps>, InnerSelectorProps>((props: InnerSelectorProps, ref) => {
  const { mode, range, rangeKey, handlePickerConfirm,  handlePickerCancel, value } = props

  const [innerValue, setInnerValue] = useState({
    detail: {
      value: [value]
    }
  })
  const handleCancel = () => {
    handlePickerCancel && handlePickerCancel()
  }
  const handleOk = () => {
    handlePickerConfirm && handlePickerConfirm(innerValue)
  }
  const handleInnerPickerChange = (e) => {
    setInnerValue(e)
    console.log('--------handleInnerPickerChange-----', e)
  }

  const renderChild = () => {
    if (mode === 'selector') {
      return  (
        <PickerViewColumn>
          {range.map((item) => {
            console.log('--------------item', item)
            const showText = typeof item === 'object' ? item[rangeKey] + '' : item
            return <View><Text>{showText}</Text></View>
          })}
        </PickerViewColumn>
      )
    } else if (mode === 'multiSelector') {
      const multiColumns = range.map((arrItem) => {
        const childItem = arrItem.map((item) => {
          const showText = typeof item === 'object' ? item[rangeKey] + '' : item
          return <View><Text>{showText}</Text></View>
        })
        return <PickerViewColumn>{childItem}</PickerViewColumn>
      })
      return multiColumns
    }
  }

  return (
    <View style={styles.centeredView}>
      <View style={styles.btnLine}>
        <View style={styles.cancel}>
          <TouchableWithoutFeedback onPress={handleCancel}> 
            <Text>取消</Text>
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.ok}>
          <TouchableWithoutFeedback onPress={handleOk}> 
            <Text style={styles.oktext}>确定</Text>
          </TouchableWithoutFeedback>
        </View>
      </View>
      <PickerView bindchange={handleInnerPickerChange}>
        {renderChild()}
      </PickerView>
    </View>
  )
})

_SelectorPicker.displayName = 'mpx-picker-selector';

export default _SelectorPicker
