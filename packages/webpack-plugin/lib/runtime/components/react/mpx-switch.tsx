/**
 * ✔ checked
 * ✔ type
 * ✔ disabled
 * ✔ color
 */
import { Switch, SwitchProps, ViewStyle, NativeSyntheticEvent } from 'react-native'
import { useRef, useEffect, forwardRef, JSX, useState, useContext, createElement } from 'react'
import { warn } from '@mpxjs/utils'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import useInnerProps, { getCustomEvent } from './getInnerListeners'

import CheckBox from './mpx-checkbox'
import { FormContext, FormFieldValue } from './context'
import { useTransformStyle, useLayout, extendObject } from './utils'

interface _SwitchProps extends SwitchProps {
  style?: ViewStyle
  name?: string
  checked?: boolean
  type: 'switch' | 'checkbox'
  disabled: boolean
  color: string
  'enable-var'?: boolean
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  'external-var-context'?: Record<string, any>
  bindchange?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  catchchange?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const _Switch = forwardRef<HandlerRef<Switch, _SwitchProps>, _SwitchProps>((props, ref): JSX.Element => {
  const {
    style = {},
    checked = false,
    type = 'switch',
    disabled = false,
    color = '#04BE02',
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    bindchange,
    catchchange
  } = props

  const [isChecked, setIsChecked] = useState<boolean>(checked)

  const changeHandler = bindchange || catchchange

  let formValuesMap: Map<string, FormFieldValue> | undefined

  const formContext = useContext(FormContext)

  if (formContext) {
    formValuesMap = formContext.formValuesMap
  }

  const {
    normalStyle,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, {
    enableVar,
    externalVarContext,
    parentFontSize,
    parentWidth,
    parentHeight
  })

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const nodeRef = useRef(null)
  useNodesRef<Switch, _SwitchProps>(props, ref, nodeRef, {
    style: normalStyle
  })

  const {
    layoutRef,
    layoutStyle,
    layoutProps
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

  const onChange = (evt: NativeSyntheticEvent<TouchEvent> | boolean, { checked }: { checked?: boolean } = {}) => {
    if (type === 'switch') {
      setIsChecked(evt as boolean)
      changeHandler && changeHandler(getCustomEvent('change', {}, { layoutRef, detail: { value: evt } }, props))
    } else {
      setIsChecked(checked as boolean)
      changeHandler && changeHandler(getCustomEvent('change', evt, { layoutRef, detail: { value: checked } }, props))
    }
  }

  const resetValue = () => {
    setIsChecked(false)
  }

  const getValue = () => {
    return isChecked
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

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      layoutProps,
      {
        ref: nodeRef,
        style: extendObject({}, normalStyle, layoutStyle)
      },
      !disabled ? { [type === 'switch' ? 'onValueChange' : '_onChange']: onChange } : {}
    ),
    [
      'checked',
      'disabled',
      'type',
      'color'
    ],
    { layoutRef }
  )

  if (type === 'checkbox') {
    return createElement(
      CheckBox,
      extendObject({}, innerProps, {
        color: color,
        style: normalStyle,
        checked: isChecked
      })
    )
  }

  return createElement(
    Switch,
    extendObject({}, innerProps, {
      style: normalStyle,
      value: isChecked,
      trackColor: { false: '#FFF', true: color },
      thumbColor: isChecked ? '#FFF' : '#f4f3f4',
      ios_backgroundColor: '#FFF'
    })
  )
})

_Switch.displayName = 'MpxSwitch'

export default _Switch
