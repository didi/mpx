/**
 * ✔ value
 * ✔ disabled
 * ✔ checked
 * ✔ color
 */
import {
  JSX,
  useState,
  useRef,
  forwardRef,
  useEffect,
  ReactNode,
  useContext,
  Dispatch,
  SetStateAction
} from 'react'
import {
  View,
  StyleSheet,
  ViewStyle,
  NativeSyntheticEvent
} from 'react-native'
import { warn } from '@mpxjs/utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import Icon from './mpx-icon'
import { splitProps, splitStyle, useLayout, useTransformStyle, wrapChildren, extendObject } from './utils'
import { CheckboxGroupContext, LabelContext } from './context'

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
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  children?: ReactNode
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
  _onChange?: (evt: NativeSyntheticEvent<TouchEvent> | unknown, { checked }: { checked: boolean }) => void
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

const Checkbox = forwardRef<HandlerRef<View, CheckboxProps>, CheckboxProps>(
  (checkboxProps, ref): JSX.Element => {
    const { textProps, innerProps: props = {} } = splitProps(checkboxProps)

    const {
      value = '',
      disabled = false,
      checked = false,
      color = '#09BB07',
      style = {},
      'enable-var': enableVar,
      'external-var-context': externalVarContext,
      'parent-font-size': parentFontSize,
      'parent-width': parentWidth,
      'parent-height': parentHeight,
      bindtap,
      _onChange
    } = props

    const [isChecked, setIsChecked] = useState<boolean>(!!checked)

    const groupContext = useContext(CheckboxGroupContext)
    let groupValue: { [key: string]: { checked: boolean; setValue: Dispatch<SetStateAction<boolean>>; } } | undefined
    let notifyChange: (evt: NativeSyntheticEvent<TouchEvent>) => void | undefined

    const defaultStyle = extendObject(
      {},
      styles.wrapper,
      disabled ? styles.wrapperDisabled : null
    )

    const styleObj = extendObject({}, styles.container, style)

    const onChange = (evt: NativeSyntheticEvent<TouchEvent>) => {
      if (disabled) return
      const checked = !isChecked
      setIsChecked(checked)
      if (groupValue) {
        groupValue[value].checked = checked
      }
      notifyChange && notifyChange(evt)
      // Called when the switch type attribute is checkbox
      _onChange && _onChange(evt, { checked })
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

    const nodeRef = useRef(null)

    useNodesRef(props, ref, nodeRef, {
      style: extendObject({}, defaultStyle, normalStyle),
      change: onChange
    })

    const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

    const { textStyle, backgroundStyle, innerStyle = {} } = splitStyle(normalStyle)

    if (backgroundStyle) {
      warn('Checkbox does not support background image-related styles!')
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
              hasVarDec,
              varContext: varContextRef.current,
              textStyle,
              textProps
            }
          )
        }
      </View>
    )
  }
)

Checkbox.displayName = 'MpxCheckbox'

export default Checkbox
