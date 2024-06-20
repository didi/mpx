/**
 * ✔ value
 * ✔ disabled
 * ✔ checked
 * ✔ color
 */
import React, {
  JSX,
  useRef,
  useState,
  forwardRef,
  useEffect,
  ReactNode
} from 'react'
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  TextStyle
} from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from '../../useNodesRef'
import Icon from './mpx-icon'
import { every, extractTextStyle, isText } from './utils'

export interface RadioProps {
  value?: string
  checked?: boolean
  disabled?: boolean
  color?: string
  style?: StyleProp<ViewStyle>
  'enable-offset'?: boolean
  children: ReactNode
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
  catchtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
  _onChange?: (
    evt: NativeSyntheticEvent<TouchEvent> | unknown,
    value?: string
  ) => void
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
      value,
      disabled = false,
      checked = false,
      color = '#09BB07',
      style = [],
      'enable-offset': enableOffset,
      children,
      bindtap,
      catchtap,
      _onChange
    } = props

    const layoutRef = useRef({})

    const [isChecked, setIsChecked] = useState<boolean>(!!checked)

    const textStyle = extractTextStyle(style)

    const defaultStyle = StyleSheet.flatten([
      styles.wrapper,
      isChecked && styles.wrapperChecked,
      disabled && styles.wrapperDisabled,
      style
    ])

    const onChange = (evt: NativeSyntheticEvent<TouchEvent>) => {
      if (disabled || isChecked) return
      setIsChecked(!isChecked)
      _onChange && _onChange(evt, value)
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
      textStyle?: StyleProp<TextStyle>
    ) => {
      if (every(children, (child) => isText(child))) {
        children = [
          <Text key='radioTextWrap' style={textStyle}>
            {children}
          </Text>
        ]
      } else {
        if (textStyle)
          console.warn(
            'Text style will be ignored unless every child of the Radio is Text node!'
          )
      }

      return children
    }

    const innerProps = useInnerProps(
      props,
      {
        ref: nodeRef,
        style: [styles.container],
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
      checked !== isChecked && setIsChecked(checked)
    }, [checked])

    return (
      <View {...innerProps}>
        <View style={defaultStyle}>
          <Icon
            type='success'
            size={24}
            color={disabled ? '#E1E1E1' : color}
            style={[
              styles.icon,
              isChecked && styles.iconChecked,
              disabled && styles.iconDisabled
            ]}
          />
        </View>
        {wrapChildren(children, textStyle)}
      </View>
    )
  }
)

Radio.displayName = 'mpx-radio'

export default Radio
