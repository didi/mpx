/**
 * ✔ value
 * ✔ disabled
 * ✔ checked
 * ✔ color
 */
import React, { JSX, useRef, useState, forwardRef } from 'react'
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent
} from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from '../../useNodesRef'
import Icon from './mpx-icon'

interface Selection {
  value?: string
  checked?: boolean
}

export interface CheckboxProps extends Selection {
  disabled?: boolean
  color?: string
  style?: StyleProp<ViewStyle>
  'enable-offset'?: boolean
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
  catchtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
  _onChange?: (
    evt: NativeSyntheticEvent<TouchEvent> | unknown,
    selection: Selection
  ) => void
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderColor: '#D1D1D1',
    borderWidth: 1,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginRight: 5
  },
  wrapperDisabled: {
    backgroundColor: '#E1E1E1'
  },
  icon: {
    opacity: 0
  },
  iconChecked: {
    opacity: 1
  }
})

const Checkbox = forwardRef<HandlerRef<View, CheckboxProps>, CheckboxProps>(
  (props, ref): JSX.Element => {
    const {
      value,
      disabled = false,
      checked = false,
      color = '#09BB07',
      style = [],
      'enable-offset': enableOffset,
      bindtap,
      catchtap,
      _onChange
    } = props

    const defaultStyle = StyleSheet.flatten([
      styles.wrapper,
      disabled && styles.wrapperDisabled,
      StyleSheet.flatten(style)
    ])

    const layoutRef = useRef({})

    const [isChecked, setIsChecked] = useState<boolean>(!!checked)

    const onChange = (evt: NativeSyntheticEvent<TouchEvent>) => {
      if (disabled) return
      setIsChecked(!isChecked)
      _onChange && _onChange(evt, { value, checked: !isChecked })
    }

    const onTap = (evt: NativeSyntheticEvent<TouchEvent>) => {
      if (disabled) return
      bindtap && bindtap(getCustomEvent('tap', evt, { layoutRef }, props))
      onChange(evt)
    }

    const catchTap = (evt: NativeSyntheticEvent<TouchEvent>) => {
      if (disabled) return
      catchtap && catchtap(getCustomEvent('tap', evt, { layoutRef }, props))
    }

    const { nodeRef } = useNodesRef(props, ref, {
      defaultStyle,
      change: onChange
    })

    const onLayout = () => {
      nodeRef.current?.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          offsetLeft: number,
          offsetTop: number
        ) => {
          layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
        }
      )
    }

    const innerProps = useInnerProps(
      props,
      {
        ref: nodeRef,
        style: defaultStyle,
        bindtap: onTap,
        catchtap: catchTap,
        ...(enableOffset ? { onLayout } : {})
      },
      ['enable-offset'],
      {
        layoutRef
      }
    )

    return (
      <View {...innerProps}>
        <Icon
          type='success_no_circle'
          size={18}
          color={disabled ? '#ADADAD' : color}
          style={isChecked ? styles.iconChecked : styles.icon}
        />
      </View>
    )
  }
)

Checkbox.displayName = 'mpx-checkbox'

export default Checkbox
