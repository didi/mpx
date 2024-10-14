/**
 * ✔ checked
 * ✔ type
 * ✔ disabled
 * ✔ color
 */
import { Switch, SwitchProps, ViewStyle, NativeSyntheticEvent, LayoutChangeEvent } from 'react-native'
import { useRef, useEffect, forwardRef, JSX, useState, useContext } from 'react'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import useInnerProps, { getCustomEvent } from './getInnerListeners'

import CheckBox from './mpx-checkbox'
import { FormContext, FormFieldValue } from './context'

import { throwReactWarning, useTransformStyle } from './utils'

interface _SwitchProps extends SwitchProps {
  style?: ViewStyle
  name?: string
  checked?: boolean
  type: 'switch' | 'checkbox'
  disabled: boolean
  color: string
  'enable-offset'?: boolean
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
    'enable-offset': enableOffset,
    bindchange,
    catchchange
  } = props

  const [isChecked, setIsChecked] = useState<boolean>(checked)

  const layoutRef = useRef({})

  const changeHandler = bindchange || catchchange

  let formValuesMap: Map<string, FormFieldValue> | undefined

  const formContext = useContext(FormContext)

  if (formContext) {
    formValuesMap = formContext.formValuesMap
  }

  const {
    normalStyle,
    hasPercent,
    setContainerWidth,
    setContainerHeight
  } = useTransformStyle(style, {
    enableVar: false,
    enablePercent: true,
    enableLineHeight: false
  })

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const { nodeRef } = useNodesRef<Switch, _SwitchProps>(props, ref)

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
      throwReactWarning('[Mpx runtime warn]: If a form component is used, the name attribute is required.')
    } else {
      formValuesMap.set(props.name, { getValue, resetValue })
    }
  }

  const onLayout = (res: LayoutChangeEvent) => {
    if (hasPercent) {
      const { width, height } = res?.nativeEvent?.layout || {}
      setContainerWidth(width || 0)
      setContainerHeight(height || 0)
    }
    nodeRef.current?.measure?.((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }
  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    ...enableOffset ? { onLayout } : {},
    ...!disabled ? { [type === 'switch' ? 'onValueChange' : '_onChange']: onChange } : {}
  }, [
    'style',
    'checked',
    'disabled',
    'type',
    'color'
  ], {
    layoutRef
  })

  if (type === 'checkbox') {
    return <CheckBox
      {...innerProps}
      color={color}
      style={normalStyle}
      checked={isChecked}
    />
  }

  return (<Switch
    {...innerProps}
    style={normalStyle}
    value={isChecked}
    trackColor={{ false: '#FFF', true: color }}
    thumbColor={isChecked ? '#FFF' : '#f4f3f4'}
    ios_backgroundColor="#FFF"
  />)
})

_Switch.displayName = 'mpx-switch'

export default _Switch
