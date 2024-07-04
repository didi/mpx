/**
 * All:
 *   ✔ value
 *   ✔ onChange
 *   ✔ onCancel
 * Selector:
 *   ✔ range
 *   ✔ rangeKey
 *   ✔ disabled
 * MultiSelector:
 *   ✔ range
 *   ✔ rangeKey
 *   ✔ disabled
 *   ✔ onColumnChange
 * Time:
 *   ✔ start
 *   ✔ end
 *   ✔ disabled
 * Date:
 *   ✔ start
 *   ✔ end
 *   ✘ fields
 *   ✔ disabled
 * Region:
 *   ✔ customItem
 *   ✔ disabled
 *
 * @hint Picker 里面嵌套的子组件要支持绑定 onPress 事件才能弹出选择框
 */

import { View, Text, Modal, StyleSheet, TouchableWithoutFeedback } from 'react-native'
import React, { forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
import useInnerProps from '@mpxjs/webpack-plugin/lib/runtime/components/react/getInnerListeners'
import { getCustomEvent } from '@mpxjs/webpack-plugin/lib/runtime/components/react/getInnerListeners'
import useNodesRef, { HandlerRef } from '@mpxjs/webpack-plugin/lib/runtime/useNodesRef' // 引入辅助函数
import { default as PickerView } from '@mpxjs/webpack-plugin/lib/runtime/components/react/mpx-picker-view'
import { default as PickerViewColumn } from '@mpxjs/webpack-plugin/lib/runtime/components/react/mpx-picker-view-column'

import { PickerProps } from '@mpxjs/webpack-plugin/lib/runtime/components/react/mpx-picker/type'
import { default as SelectorPicker } from './selector'


const _Picker = forwardRef<HandlerRef<View, PickerProps>, PickerProps>((props: PickerProps, ref) => {
  const { mode = 'selector', value, bindcancel, bindchange, children } = props

  const [visible, setVisible] = useState(false)
  console.log('---------------visible---', visible)
  const handleModalStatus = (status: boolean) => {
    setVisible(status)
  }

  const handleConfirm = (e) => {
    handleModalStatus(false)
    bindchange && bindchange(e)
  }

  const handleCancel = () => {
    handleModalStatus(false)
    bindcancel && bindcancel()
  }

  const handleChildClick = () => {
    handleModalStatus(true)
  }

  const selectorProps = {
    mode,
    value,
    range: props['range'],
    rangeKey: props['range-key'],
    handlePickerConfirm: handleConfirm,
    handlePickerCancel: handleCancel
  }


  const renderChildren = () => {
    return <View>
      <TouchableWithoutFeedback onPress={handleChildClick}>
        {children}
      </TouchableWithoutFeedback>
    </View>
  }

  const renderModalChildren = () => {
    if (['selector', 'multiSelector'].includes(mode)) {
      return <SelectorPicker
        {...selectorProps}
      ></SelectorPicker>
    } else {
      return null
    }
  }

  return (<>
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
     >
      {renderModalChildren()}
     </Modal>
     {renderChildren()}
  </>)
})

_Picker.displayName = 'mpx-picker';

export default _Picker
