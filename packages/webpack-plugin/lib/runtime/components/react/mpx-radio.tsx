/**
 * ✔ value
 * ✔ disabled
 * ✔ checked
 * ✔ color
 */
import { JSX, useRef, useState, forwardRef, useEffect, ReactNode, useContext, Dispatch, SetStateAction } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  NativeSyntheticEvent,
  TextStyle
} from 'react-native'
import { LabelContext, RadioGroupContext } from './context'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { every, splitStyle, splitProps, isText, throwReactWarning } from './utils'
import Icon from './mpx-icon'

export interface RadioProps {
  value?: string
  checked?: boolean
  disabled?: boolean
  color?: string
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  children: ReactNode
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
  catchtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
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
  (props, ref): JSX.Element => {
    const {
      value = '',
      disabled = false,
      checked = false,
      color = '#09BB07',
      style = [],
      'enable-offset': enableOffset,
      children,
      bindtap,
      catchtap
    } = props

    const layoutRef = useRef({})

    const [isChecked, setIsChecked] = useState<boolean>(!!checked)

    const groupContext = useContext(RadioGroupContext)
    let groupValue: { [key: string]: { checked: boolean; setValue: Dispatch<SetStateAction<boolean>>; } } | undefined
    let notifyChange: (evt: NativeSyntheticEvent<TouchEvent>) => void | undefined

    const labelContext = useContext(LabelContext)

    const { textStyle, imageStyle, innerStyle } = splitStyle(style)

    if (imageStyle) {
      throwReactWarning('[Mpx runtime warn]: Radio does not support background image-related styles!')
    }

    const defaultStyle = {
      ...styles.wrapper,
      ...(isChecked && styles.wrapperChecked),
      ...(disabled && styles.wrapperDisabled)
    }

    const viewStyle = {
      ...defaultStyle,
      ...innerStyle
    }

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

    const wrapChildren = (
      children: ReactNode,
      textStyle?: TextStyle
    ) => {
      if (!children) return children
      const { textProps } = splitProps(props)

      if (every(children, (child) => isText(child))) {
        if (textStyle || textProps) {
          children = <Text key='radioTextWrap' style={textStyle || {}} {...(textProps || {})}>
            {children}
          </Text>
        }
      } else {
        if (textStyle) {
          throwReactWarning(
            '[Mpx runtime warn]: Text style will be ignored unless every child of the Radio is Text node!'
          )
        }
      }

      return children
    }

    if (groupContext) {
      groupValue = groupContext.groupValue
      notifyChange = groupContext.notifyChange
    }

    if (labelContext) {
      labelContext.current.triggerChange = onChange
    }

    const innerProps = useInnerProps(
      props,
      {
        ref: nodeRef,
        style: styles.container,
        bindtap: onTap,
        catchtap: catchTap,
        ...(enableOffset ? { onLayout } : {})
      },
      ['enable-offset'],
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

    return (
      <View {...innerProps}>
        <View style={viewStyle}>
          <Icon
            type='success'
            size={24}
            color={disabled ? '#E1E1E1' : color}
            style={{
              ...styles.icon,
              ...(isChecked && styles.iconChecked),
              ...(disabled && styles.iconDisabled)
            }}
          />
        </View>
        {wrapChildren(children, textStyle)}
      </View>
    )
  }
)

Radio.displayName = 'MpxRadio'

export default Radio
