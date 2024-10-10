/**
 * ✔ value
 * ✔ disabled
 * ✔ checked
 * ✔ color
 */
import {
  JSX,
  useRef,
  useState,
  forwardRef,
  useEffect,
  ReactNode,
  useContext,
  Dispatch,
  SetStateAction,
  Children,
  cloneElement
} from 'react'

import {
  View,
  StyleSheet,
  ViewStyle,
  NativeSyntheticEvent,
  TextStyle,
  LayoutChangeEvent
} from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import Icon from './mpx-icon'
import { splitStyle, isText, splitProps, throwReactWarning, useTransformStyle } from './utils'
import { CheckboxGroupContext, LabelContext, VarContext } from './context'

interface Selection {
  value?: string
  checked?: boolean
}

export interface CheckboxProps extends Selection {
  disabled?: boolean
  color?: string
  style?: ViewStyle & Record<string, any>
  groupValue?: Array<string>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  children?: ReactNode
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

function wrapChildren (props: CheckboxProps, { hasVarDec }: { hasVarDec: boolean }, textStyle?: TextStyle, varContext?: Record<string, any>) {
  const { textProps } = splitProps(props)
  let { children } = props

  if (textStyle || textProps) {
    children = Children.map(children, (child) => {
      if (isText(child)) {
        const style = { ...textStyle, ...child.props.style }
        return cloneElement(child, { ...textProps, style })
      }
      return child
    })
  }

  if (hasVarDec && varContext) {
    children = <VarContext.Provider key='childrenWrap' value={varContext}>{children}</VarContext.Provider>
  }

  return [
    children
  ]
}

const Checkbox = forwardRef<HandlerRef<View, CheckboxProps>, CheckboxProps>(
  (props, ref): JSX.Element => {
    const {
      value = '',
      disabled = false,
      checked = false,
      color = '#09BB07',
      style = {},
      'enable-offset': enableOffset,
      'enable-var': enableVar,
      'external-var-context': externalVarContext,
      bindtap,
      catchtap
    } = props

    const layoutRef = useRef({})

    const [isChecked, setIsChecked] = useState<boolean>(!!checked)

    const groupContext = useContext(CheckboxGroupContext)
    let groupValue: { [key: string]: { checked: boolean; setValue: Dispatch<SetStateAction<boolean>>; } } | undefined
    let notifyChange: (evt: NativeSyntheticEvent<TouchEvent>) => void | undefined

    const defaultStyle = {
      ...styles.wrapper,
      ...(disabled && styles.wrapperDisabled)
    }

    const styleObj = {
      ...styles.container,
      ...style
    }

    const { 
      normalStyle,
      hasPercent,
      hasVarDec,
      varContextRef,
      setContainerWidth,
      setContainerHeight
    } = useTransformStyle(styleObj, { enableVar, externalVarContext })

    const { textStyle, backgroundStyle, innerStyle } = splitStyle(normalStyle)

    if (backgroundStyle) {
      throwReactWarning('[Mpx runtime warn]: Checkbox does not support background image-related styles!')
    }

    const onChange = (evt: NativeSyntheticEvent<TouchEvent>) => {
      if (disabled) return
      const checked = !isChecked
      setIsChecked(checked)
      if (groupValue) {
        groupValue[value].checked = checked
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
      onChange(evt)
    }

    const { nodeRef } = useNodesRef(props, ref, {
      defaultStyle,
      change: onChange
    })

    const onLayout = (res: LayoutChangeEvent) => {
      if (hasPercent) {
        const { width, height } = res?.nativeEvent?.layout || {}
        setContainerWidth(width || 0)
        setContainerHeight(height || 0)
      }
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

    const labelContext = useContext(LabelContext)

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
        style: innerStyle,
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
        <View style={defaultStyle}>
          <Icon
            type='success_no_circle'
            size={18}
            color={disabled ? '#ADADAD' : color}
            style={isChecked ? styles.iconChecked : styles.icon}
          />
        </View>
        {
          wrapChildren(
            props,
            {
              hasVarDec 
            },
            textStyle,
            varContextRef.current
          )
        }
      </View>
    )
  }
)

Checkbox.displayName = 'mpx-checkbox'

export default Checkbox
