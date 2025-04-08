/**
 * ✔ value
 * - type: Partially. Not support `safe-password`、`nickname`
 * ✔ password
 * ✔ placeholder
 * - placeholder-style: Only support color.
 * - placeholder-class: Only support color.
 * ✔ disabled
 * ✔ maxlength
 * ✔ cursor-spacing
 * ✔ auto-focus
 * ✔ focus
 * ✔ confirm-type
 * ✘ always-embed
 * ✔ confirm-hold
 * ✔ cursor
 * ✔ cursor-color
 * ✔ selection-start
 * ✔ selection-end
 * ✔ adjust-position
 * ✘ hold-keyboard
 * ✘ safe-password-cert-path
 * ✘ safe-password-length
 * ✘ safe-password-time-stamp
 * ✘ safe-password-nonce
 * ✘ safe-password-salt
 * ✘ safe-password-custom-hash
 * - bindinput: No `keyCode` info.
 * - bindfocus: No `height` info.
 * - bindblur: No `encryptedValue`、`encryptError` info.
 * ✔ bindconfirm
 * ✘ bindkeyboardheightchange
 * ✘ bindnicknamereview
 * ✔ bind:selectionchange
 * ✘ bind:keyboardcompositionstart
 * ✘ bind:keyboardcompositionupdate
 * ✘ bind:keyboardcompositionend
 * ✘ bind:onkeyboardheightchange
 */
import { JSX, forwardRef, useRef, useState, useContext, useEffect, createElement } from 'react'
import {
  Platform,
  TextInput,
  TextStyle,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputTextInputEventData,
  TextInputKeyPressEventData,
  TextInputContentSizeChangeEventData,
  FlexStyle,
  TextInputSelectionChangeEventData,
  TextInputFocusEventData,
  TextInputChangeEventData,
  TextInputSubmitEditingEventData
} from 'react-native'
import { warn } from '@mpxjs/utils'
import { useUpdateEffect, useTransformStyle, useLayout, extendObject, isIOS } from './utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { FormContext, FormFieldValue, KeyboardAvoidContext } from './context'

type InputStyle = Omit<
  TextStyle & ViewStyle & Pick<FlexStyle, 'minHeight'>,
  | 'borderLeftWidth'
  | 'borderTopWidth'
  | 'borderRightWidth'
  | 'borderBottomWidth'
  | 'borderTopLeftRadius'
  | 'borderTopRightRadius'
  | 'borderBottomRightRadius'
  | 'borderBottomLeftRadius'
>

type Type = 'text' | 'number' | 'idcard' | 'digit'

type ConfirmType = 'done' | 'send' | 'search' | 'next' | 'go' | 'return'

export interface InputProps {
  name?: string
  style?: InputStyle & Record<string, any>
  value?: string | number
  type?: Type
  password?: boolean
  placeholder?: string
  disabled?: boolean
  'cursor-spacing'?: number
  maxlength?: number
  'auto-focus'?: boolean
  focus?: boolean
  'confirm-type'?: ConfirmType
  'confirm-hold'?: boolean
  cursor?: number
  'cursor-color'?: string
  'selection-start'?: number
  'selection-end'?: number
  'placeholder-style'?: { color?: string }
  'enable-offset'?: boolean,
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  'adjust-position': boolean,
  bindinput?: (evt: NativeSyntheticEvent<TextInputTextInputEventData> | unknown) => void
  bindfocus?: (evt: NativeSyntheticEvent<TextInputFocusEventData> | unknown) => void
  bindblur?: (evt: NativeSyntheticEvent<TextInputFocusEventData> | unknown) => void
  bindconfirm?: (evt: NativeSyntheticEvent<TextInputSubmitEditingEventData | TextInputKeyPressEventData> | unknown) => void
  bindselectionchange?: (evt: NativeSyntheticEvent<TextInputSelectionChangeEventData> | unknown) => void
}

export interface PrivateInputProps {
  allowFontScaling?: boolean
  multiline?: boolean
  'auto-height'?: boolean
  bindlinechange?: (evt: NativeSyntheticEvent<TextInputContentSizeChangeEventData> | unknown) => void
}

type FinalInputProps = InputProps & PrivateInputProps

const keyboardTypeMap: Record<Type, string> = {
  text: 'default',
  number: 'numeric',
  idcard: 'default',
  digit: isIOS ? 'decimal-pad' : 'numeric'
}

const Input = forwardRef<HandlerRef<TextInput, FinalInputProps>, FinalInputProps>((props: FinalInputProps, ref): JSX.Element => {
  const {
    style = {},
    allowFontScaling = false,
    type = 'text',
    value,
    password,
    'placeholder-style': placeholderStyle = {},
    disabled,
    maxlength = 140,
    'cursor-spacing': cursorSpacing = 0,
    'auto-focus': autoFocus,
    focus,
    'confirm-type': confirmType = 'done',
    'confirm-hold': confirmHold = false,
    cursor,
    'cursor-color': cursorColor,
    'selection-start': selectionStart = -1,
    'selection-end': selectionEnd = -1,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    'adjust-position': adjustPosition = true,
    bindinput,
    bindfocus,
    bindblur,
    bindconfirm,
    bindselectionchange,
    // private
    multiline,
    'auto-height': autoHeight,
    bindlinechange
  } = props

  const formContext = useContext(FormContext)

  const keyboardAvoid = useContext(KeyboardAvoidContext)

  let formValuesMap: Map<string, FormFieldValue> | undefined

  if (formContext) {
    formValuesMap = formContext.formValuesMap
  }

  const parseValue = (value: string | number | undefined): string => {
    if (typeof value === 'string') {
      if (value.length > maxlength && maxlength >= 0) {
        return value.slice(0, maxlength)
      }
      return value
    }
    if (typeof value === 'number') return value + ''
    return ''
  }

  const keyboardType = keyboardTypeMap[type]
  const defaultValue = parseValue(value)
  const textAlignVertical = multiline ? 'top' : 'auto'

  const tmpValue = useRef<string>(defaultValue)
  const cursorIndex = useRef<number>(0)
  const lineCount = useRef<number>(0)

  const [inputValue, setInputValue] = useState(defaultValue)
  const [contentHeight, setContentHeight] = useState(0)
  const [selection, setSelection] = useState({ start: -1, end: -1 })

  const styleObj = extendObject(
    { padding: 0, backgroundColor: '#fff' },
    style,
    multiline && autoHeight
      ? { height: 'auto', minHeight: Math.max((style as any)?.minHeight || 35, contentHeight) }
      : {}
  )

  const {
    hasSelfPercent,
    normalStyle,
    setWidth,
    setHeight
  } = useTransformStyle(styleObj, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const nodeRef = useRef(null)
  useNodesRef(props, ref, nodeRef, {
    style: normalStyle
  })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

  useEffect(() => {
    if (inputValue !== value) {
      setInputValue(parseValue(value))
    }
  }, [value])

  useEffect(() => {
    if (typeof cursor === 'number') {
      setSelection({ start: cursor, end: cursor })
    } else if (selectionStart >= 0 && selectionEnd >= 0 && selectionStart !== selectionEnd) {
      setSelection({ start: selectionStart, end: selectionEnd })
    }
  }, [cursor, selectionStart, selectionEnd])

  // have not selection on the Android platformg
  const getCursorIndex = (
    changedSelection: TextInputSelectionChangeEventData['selection'] | undefined,
    prevValue: string,
    curValue: string
  ) => {
    if (changedSelection) return changedSelection.end
    if (!prevValue || !curValue || prevValue.length === curValue.length) return curValue.length
    const prevStr = prevValue.substring(cursorIndex.current)
    const curStr = curValue.substring(cursorIndex.current)
    return cursorIndex.current + curStr.length - prevStr.length
  }

  const onChange = (evt: NativeSyntheticEvent<TextInputChangeEventData & TextInputSelectionChangeEventData>) => {
    const { text, selection } = evt.nativeEvent
    // will trigger twice on the Android platformg, prevent the second trigger
    if (tmpValue.current === text) return
    const index = getCursorIndex(selection, tmpValue.current, text)
    tmpValue.current = text
    cursorIndex.current = index
    if (bindinput) {
      const result = bindinput(
        getCustomEvent(
          'input',
          evt,
          {
            detail: {
              value: tmpValue.current,
              cursor: cursorIndex.current
            },
            layoutRef
          },
          props
        )
      )
      if (typeof result === 'string') {
        tmpValue.current = result
        setInputValue(result)
      } else {
        setInputValue(tmpValue.current)
      }
    } else {
      setInputValue(tmpValue.current)
    }
  }

  const setKeyboardAvoidContext = () => {
    if (adjustPosition && keyboardAvoid) {
      keyboardAvoid.current = { cursorSpacing, ref: nodeRef }
    }
  }

  const onTouchStart = () => {
    // sometimes the focus event occurs later than the keyboardWillShow event
    setKeyboardAvoidContext()
  }

  const onFocus = (evt: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setKeyboardAvoidContext()
    bindfocus && bindfocus(
      getCustomEvent(
        'focus',
        evt,
        {
          detail: {
            value: tmpValue.current || ''
          },
          layoutRef
        },
        props
      )
    )
  }

  const onBlur = (evt: NativeSyntheticEvent<TextInputFocusEventData>) => {
    bindblur && bindblur(
      getCustomEvent(
        'blur',
        evt,
        {
          detail: {
            value: tmpValue.current || '',
            cursor: cursorIndex.current
          },
          layoutRef
        },
        props
      )
    )
  }

  const onSubmitEditing = (evt: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    bindconfirm!(
      getCustomEvent(
        'confirm',
        evt,
        {
          detail: {
            value: tmpValue.current || ''
          },
          layoutRef
        },
        props
      )
    )
  }

  const onSelectionChange = (evt: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    const { selection } = evt.nativeEvent
    const { start, end } = selection
    cursorIndex.current = start
    setSelection(selection)
    bindselectionchange && bindselectionchange(
      getCustomEvent(
        'selectionchange',
        evt,
        {
          detail: {
            selectionStart: start,
            selectionEnd: end
          },
          layoutRef
        },
        props
      )
    )
  }

  const onContentSizeChange = (evt: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const { width, height } = evt.nativeEvent.contentSize
    if (width && height) {
      if (!multiline || !autoHeight || height === contentHeight) return
      lineCount.current += height > contentHeight ? 1 : -1
      const lineHeight = lineCount.current === 0 ? 0 : height / lineCount.current
      bindlinechange &&
        bindlinechange(
          getCustomEvent(
            'linechange',
            evt,
            {
              detail: {
                height,
                lineHeight,
                lineCount: lineCount.current
              },
              layoutRef
            },
            props
          )
        )
      setContentHeight(height)
    }
  }

  const resetValue = () => {
    setInputValue('')
  }

  const getValue = () => {
    return inputValue
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

  useEffect(() => {
    if (focus) {
      setKeyboardAvoidContext()
    }
  }, [focus])

  useUpdateEffect(() => {
    if (!nodeRef?.current) {
      return
    }
    focus
      ? (nodeRef.current as TextInput)?.focus()
      : (nodeRef.current as TextInput)?.blur()
  }, [focus])

  const innerProps = useInnerProps(
    props,
    extendObject(
      {
        ref: nodeRef,
        style: extendObject({}, normalStyle, layoutStyle),
        allowFontScaling,
        keyboardType: keyboardType,
        secureTextEntry: !!password,
        defaultValue: defaultValue,
        value: inputValue,
        maxLength: maxlength === -1 ? undefined : maxlength,
        editable: !disabled,
        autoFocus: !!autoFocus || !!focus,
        selection: selection,
        selectionColor: cursorColor,
        blurOnSubmit: !multiline && !confirmHold,
        underlineColorAndroid: 'rgba(0,0,0,0)',
        textAlignVertical: textAlignVertical,
        placeholderTextColor: placeholderStyle?.color,
        multiline: !!multiline
      },
      !!multiline && confirmType === 'return' ? {} : { enterKeyHint: confirmType },
      layoutProps,
      {
        onTouchStart,
        onFocus,
        onBlur,
        onChange,
        onSelectionChange,
        onContentSizeChange,
        onSubmitEditing: bindconfirm && !multiline && onSubmitEditing
      }
    ),
    [
      'type',
      'password',
      'placeholder-style',
      'disabled',
      'auto-focus',
      'focus',
      'confirm-type',
      'confirm-hold',
      'cursor',
      'cursor-color',
      'selection-start',
      'selection-end'
    ],
    {
      layoutRef
    }
  )
  return createElement(TextInput, innerProps)
})

Input.displayName = 'MpxInput'

export default Input
