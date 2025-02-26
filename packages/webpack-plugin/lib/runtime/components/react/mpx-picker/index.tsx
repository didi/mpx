import React, { forwardRef, useRef, useContext, useEffect } from 'react'
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import { warn } from '@mpxjs/utils'
import PickerSelector from './selector'
import PickerMultiSelector from './multiSelector'
import PickerTime from './time'
import PickerDate from './date'
import PickerRegion from './region'
import { FormContext, FormFieldValue, RouteContext } from '../context'
import useNodesRef, { HandlerRef } from '../useNodesRef'
import useInnerProps, { getCustomEvent } from '../getInnerListeners'
import { extendObject } from '../utils'
import { createPopupManager } from '../mpx-popup'
import { EventType, LanguageCode, PickerMode, PickerProps } from './type'

/**
 * ✔ mode
 * ✔ disabled
 * ✔ bindcancel
 * ✔ bindchange
 * ✔ range
 * ✔ range-key
 * ✔ value
 * ✔ start
 * ✔ end
 * ✔ fields 有效值 year,month,day，表示选择器的粒度
 * ✔ end
 * ✔ custom-item
 * ✔ level 选择器层级 province，city，region，<sub-district不支持>
 * ✔ level
 * ✔ header-text
 * ✔ bindcolumnchange
 */

const styles = StyleSheet.create({
  header: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eeeeee'
  },
  headerText: {
    color: '#333333',
    fontSize: 18,
    textAlign: 'center'
  },
  footer: {
    gap: 20,
    height: 50,
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 110,
    borderRadius: 5
  },
  cancelButton: {
    backgroundColor: '#eeeeee'
  },
  confirmButton: {
    backgroundColor: '#1AAD19'
  },
  cancelText: {
    color: 'green',
    fontSize: 18,
    textAlign: 'center'
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center'
  }
})

const pickerModalMap: Record<PickerMode, React.ComponentType<PickerProps>> = {
  [PickerMode.SELECTOR]: PickerSelector,
  [PickerMode.MULTI_SELECTOR]: PickerMultiSelector,
  [PickerMode.TIME]: PickerTime,
  [PickerMode.DATE]: PickerDate,
  [PickerMode.REGION]: PickerRegion
}

const getDefaultValue = (mode: PickerMode) => {
  switch (mode) {
    case PickerMode.SELECTOR:
    case PickerMode.MULTI_SELECTOR:
    case PickerMode.REGION:
      return []
    case PickerMode.TIME:
    case PickerMode.DATE:
    default:
      return ''
  }
}

const buttonTextMap: Record<LanguageCode, { cancel: string; confirm: string }> = {
  'zh-CN': {
    cancel: '取消',
    confirm: '确定'
  },
  'en-US': {
    cancel: 'Cancel',
    confirm: 'Confirm'
  }
}

const Picker = forwardRef<HandlerRef<View, PickerProps>, PickerProps>(
  (props: PickerProps, ref): React.JSX.Element => {
    const {
      mode,
      value,
      range = null,
      children,
      disabled,
      bindcancel,
      bindchange,
      'header-text': headerText = ''
    } = props

    const pageId = useContext(RouteContext)
    const buttonText = buttonTextMap[(global.__mpx?.i18n?.locale as LanguageCode) || 'zh-CN']
    const pickerValue = useRef(value)
    pickerValue.current = Array.isArray(value) ? value.slice() : value
    const innerLayout = useRef({})
    const nodeRef = useRef(null)
    const pickerRef = useRef<any>(null)
    const { open, show, hide, remove } = useRef(createPopupManager()).current

    useNodesRef<View, PickerProps>(props, ref, nodeRef)
    const innerProps = useInnerProps(
      props,
      {
        ref: nodeRef
      },
      [],
      { layoutRef: innerLayout }
    )
    const getInnerLayout = (layout: React.MutableRefObject<{}>) => {
      innerLayout.current = layout.current
    }

    useEffect(() => {
      if (range && pickerRef.current && mode === PickerMode.MULTI_SELECTOR) {
        pickerRef.current.updateRange?.(range)
      }
    }, [JSON.stringify(range)])

    /** --- form 表单组件内部方法 --- */
    const getValue = () => {
      return pickerValue.current
    }
    const resetValue = () => {
      const defalutValue = getDefaultValue(mode) // 默认值
      pickerRef.current.updateValue?.(defalutValue)
    }
    const formContext = useContext(FormContext)
    let formValuesMap: Map<string, FormFieldValue> | undefined
    if (formContext) {
      formValuesMap = formContext.formValuesMap
    }
    if (formValuesMap) {
      if (!props.name) {
        warn('If a form component is used, the name attribute is required.')
      } else {
        formValuesMap.set(props.name, { getValue, resetValue })
      }
    }
    useEffect(() => {
      return () => {
        if (formValuesMap && props.name) {
          formValuesMap.delete(props.name)
        }
      }
    }, [])
    /** --- form 表单组件内部方法 --- */

    const onChange = (e: EventType) => {
      const { value } = e.detail
      pickerValue.current = value
    }

    const onColumnChange = (columnIndex: number, value: number) => {
      if (mode !== PickerMode.MULTI_SELECTOR) {
        return
      }
      const eventData = getCustomEvent(
        'columnchange',
        {},
        { detail: { column: columnIndex, value }, layoutRef: innerLayout }
      )
      props.bindcolumnchange?.(eventData)
    }

    const onCancel = () => {
      bindcancel?.()
      hide()
    }

    const onConfirm = () => {
      const eventData = getCustomEvent(
        'change',
        {},
        { detail: { value: pickerValue.current }, layoutRef: innerLayout }
      )
      bindchange?.(eventData)
      hide()
    }

    const specificProps = extendObject(innerProps, {
      mode,
      children,
      bindchange: onChange,
      bindcolumnchange: onColumnChange,
      getInnerLayout,
      getRange: () => range
    })

    const renderPickerContent = () => {
      if (disabled) {
        return null
      }
      const _mode = mode ?? PickerMode.SELECTOR
      if (!(_mode in pickerModalMap)) {
        return warn(`[Mpx runtime warn]: Unsupported <picker> mode: ${mode}`)
      }
      const _value: any = value
      const PickerModal = pickerModalMap[_mode]
      const renderPickerModal = (
        <>
          {headerText && (
            <View style={[styles.header]}>
              <Text style={[styles.headerText]}>{headerText}</Text>
            </View>
          )}
          <PickerModal {...specificProps} value={_value} ref={pickerRef}></PickerModal>
          <View style={[styles.footer]}>
            <View
              onTouchEnd={onCancel}
              style={[styles.footerItem, styles.cancelButton]}
            >
              <Text style={[styles.cancelText]}>{buttonText.cancel}</Text>
            </View>
            <View
              onTouchEnd={onConfirm}
              style={[styles.footerItem, styles.confirmButton]}
            >
              <Text style={[styles.confirmText]}>{buttonText.confirm}</Text>
            </View>
          </View>
        </>
      )
      const contentHeight = headerText ? 350 : 310
      open(renderPickerModal, pageId, { contentHeight })
    }

    useEffect(() => {
      renderPickerContent()
      return () => {
        remove()
      }
    }, [])

    return (
      <TouchableWithoutFeedback onPress={show}>
        {children}
      </TouchableWithoutFeedback>
    )
  }
)

Picker.displayName = 'MpxPicker'
export default Picker
