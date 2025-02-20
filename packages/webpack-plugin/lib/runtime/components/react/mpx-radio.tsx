/**
 * ✔ value
 * ✔ disabled
 * ✔ checked
 * ✔ color
 */
import { JSX, useRef, useState, forwardRef, useEffect, ReactNode, useContext, Dispatch, SetStateAction, createElement } from 'react'
import { View, StyleSheet, ViewStyle, NativeSyntheticEvent } from 'react-native'
import { warn } from '@mpxjs/utils'
import { LabelContext, RadioGroupContext } from './context'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useLayout, useTransformStyle, wrapChildren, extendObject } from './utils'
import Icon from './mpx-icon'

export interface RadioProps {
  value?: string
  checked?: boolean
  disabled?: boolean
  color?: string
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  children: ReactNode
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderColor: '#D1D1D1',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginRight: 5,
    overflow: 'hidden'
  },
  wrapperChecked: {
    borderWidth: 0
  },
  wrapperDisabled: {
    backgroundColor: '#E1E1E1'
  },
  icon: {
    opacity: 0
  },
  iconDisabled: {
    backgroundColor: '#ADADAD'
  },
  iconChecked: {
    opacity: 1
  }
})

const Radio = forwardRef<HandlerRef<View, RadioProps>, RadioProps>(
  (radioProps, ref): JSX.Element => {
    const { textProps, innerProps: props = {} } = splitProps(radioProps)

    const {
      value = '',
      disabled = false,
      checked = false,
      color = '#09BB07',
      style = [],
      'enable-var': enableVar,
      'external-var-context': externalVarContext,
      'parent-font-size': parentFontSize,
      'parent-width': parentWidth,
      'parent-height': parentHeight,
      bindtap
    } = props

    const [isChecked, setIsChecked] = useState<boolean>(!!checked)

    const groupContext = useContext(RadioGroupContext)
    let groupValue: { [key: string]: { checked: boolean; setValue: Dispatch<SetStateAction<boolean>>; } } | undefined
    let notifyChange: (evt: NativeSyntheticEvent<TouchEvent>) => void | undefined

    const labelContext = useContext(LabelContext)

    const defaultStyle = extendObject(
      {},
      styles.wrapper,
      isChecked ? styles.wrapperChecked : {},
      disabled ? styles.wrapperDisabled : {}
    )

    const styleObj = extendObject({}, styles.container, style)

    const onChange = (evt: NativeSyntheticEvent<TouchEvent>) => {
      if (disabled || isChecked) return
      setIsChecked(!isChecked)
      if (groupValue) {
        for (const [key, radio] of Object.entries(groupValue)) {
          if (!radio) continue
          radio.setValue(key === value)
          radio.checked = key === value
        }
      }
      notifyChange && notifyChange(evt)
    }

    const onTap = (evt: NativeSyntheticEvent<TouchEvent>) => {
      bindtap && bindtap(getCustomEvent('tap', evt, { layoutRef }, props))
      onChange(evt)
    }

    const {
      hasSelfPercent,
      normalStyle,
      hasVarDec,
      varContextRef,
      setWidth,
      setHeight
    } = useTransformStyle(styleObj, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

    const { textStyle, backgroundStyle, innerStyle = {} } = splitStyle(normalStyle)

    if (backgroundStyle) {
      warn('Radio does not support background image-related styles!')
    }

    const nodeRef = useRef(null)
    useNodesRef(props, ref, nodeRef, {
      style: extendObject({}, defaultStyle, normalStyle),
      change: onChange
    })

    const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

    if (groupContext) {
      groupValue = groupContext.groupValue
      notifyChange = groupContext.notifyChange
    }

    if (labelContext) {
      labelContext.current.triggerChange = onChange
    }

    const innerProps = useInnerProps(
      props,
      extendObject(
        {
          ref: nodeRef,
          style: extendObject({}, innerStyle, layoutStyle)
        },
        layoutProps,
        {
          bindtap: !disabled && onTap
        }
      ),
      [
        'value',
        'disabled',
        'checked'
      ],
      {
        layoutRef
      }
    )

    useEffect(() => {
      if (groupValue) {
        groupValue[value] = {
          checked: checked,
          setValue: setIsChecked
        }
      }
      return () => {
        if (groupValue) {
          delete groupValue[value]
        }
      }
    }, [])

    useEffect(() => {
      if (checked !== isChecked) {
        setIsChecked(checked)
        if (groupValue) {
          groupValue[value].checked = checked
        }
      }
    }, [checked])

    return createElement(View, innerProps,
      createElement(
        View,
        { style: defaultStyle },
        createElement(Icon, {
          type: 'success',
          size: 24,
          color: disabled ? '#E1E1E1' : color,
          style: extendObject({}, styles.icon, isChecked && styles.iconChecked, disabled && styles.iconDisabled)
        })
      ),
      wrapChildren(
        props,
        {
          hasVarDec,
          varContext: varContextRef.current,
          textStyle,
          textProps
        }
      )
    )
  }
)

Radio.displayName = 'MpxRadio'

export default Radio
