/**
 * ✔ value
 * - type: Partially. Not support `safe-password`、`nickname`
 * ✔ password
 * ✔ placeholder
 * - placeholder-style: Only support color.
 * ✘ placeholder-class
 * ✔ disabled
 * ✔ maxlength
 * ✘ cursor-spacing
 * ✔ auto-focus
 * ✔ focus
 * ✔ confirm-type
 * ✘ always-embed
 * ✔ confirm-hold
 * ✔ cursor
 * ✔ cursor-color
 * ✔ selection-start
 * ✔ selection-end
 * ✘ adjust-position
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
import { JSX, forwardRef, useMemo, useRef, useState, useContext, useEffect } from 'react'
import {
  KeyboardTypeOptions,
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
import { parseInlineStyle, useUpdateEffect, throwReactWarning } from './utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { FormContext, FormFieldValue } from './context'

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
export interface InputProps {
  name?: string
  style?: InputStyle & Record<string, any>
  value?: string
  type?: Type
  password?: boolean
  placeholder?: string
  disabled?: boolean
  maxlength?: number
  'auto-focus'?: boolean
  focus?: boolean
  'confirm-type'?: 'done' | 'send' | 'search' | 'next' | 'go'
  'confirm-hold'?: boolean
  cursor?: number
  'cursor-color'?: string
  'selection-start'?: number
  'selection-end'?: number
  'placeholder-style'?: string
  'enable-offset'?: boolean,
  bindinput?: (evt: NativeSyntheticEvent<TextInputTextInputEventData> | unknown) => void
  bindfocus?: (evt: NativeSyntheticEvent<TextInputFocusEventData> | unknown) => void
  bindblur?: (evt: NativeSyntheticEvent<TextInputFocusEventData> | unknown) => void
  bindconfirm?: (evt: NativeSyntheticEvent<TextInputSubmitEditingEventData | TextInputKeyPressEventData> | unknown) => void
  bindselectionchange?: (evt: NativeSyntheticEvent<TextInputSelectionChangeEventData> | unknown) => void
}

export interface PrivateInputProps {
  multiline?: boolean
  'auto-height'?: boolean
  bindlinechange?: (evt: NativeSyntheticEvent<TextInputContentSizeChangeEventData> | unknown) => void
}

type FinalInputProps = InputProps & PrivateInputProps

const keyboardTypeMap: Record<Type, string> = {
  text: 'default',
  number: 'numeric',
  idcard: 'default',
  digit:
    Platform.select({
      ios: 'decimal-pad',
      android: 'numeric'
    }) || ''
}

const Input = forwardRef<HandlerRef<TextInput, FinalInputProps>, FinalInputProps>((props: FinalInputProps, ref): JSX.Element => {
  const {
    style = {},
    type = 'text',
    value,
    password,
    'placeholder-style': placeholderStyle,
    disabled,
    maxlength = 140,
    'auto-focus': autoFocus,
    focus,
    'confirm-type': confirmType = 'done',
    'confirm-hold': confirmHold = false,
    cursor,
    'cursor-color': cursorColor,
    'selection-start': selectionStart = -1,
    'selection-end': selectionEnd = -1,
    'enable-offset': enableOffset,
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

  let formValuesMap: Map<string, FormFieldValue> | undefined

  if (formContext) {
    formValuesMap = formContext.formValuesMap
  }

  const { nodeRef } = useNodesRef(props, ref)

  const keyboardType = keyboardTypeMap[type]
  const defaultValue = type === 'number' && value ? value + '' : value
  const placeholderTextColor = parseInlineStyle(placeholderStyle)?.color
  const textAlignVertical = multiline ? 'top' : 'auto'

  const layoutRef = useRef({})
  const tmpValue = useRef<string>()
  const cursorIndex = useRef<number>(0)
  const lineCount = useRef<number>(0)

  const [inputValue, setInputValue] = useState(defaultValue)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (inputValue !== value) {
      setInputValue(value)
    }
  }, [value])

  const selection = useMemo(() => {
    if (selectionStart >= 0 && selectionEnd >= 0) {
      return { start: selectionStart, end: selectionEnd }
    } else if (typeof cursor === 'number') {
      return { start: cursor, end: cursor }
    }
  }, [cursor, selectionStart, selectionEnd])

  const onTextInput = ({ nativeEvent }: NativeSyntheticEvent<TextInputTextInputEventData>) => {
    if (!bindinput && !bindblur) return
    const {
      range: { start, end },
      text
    } = nativeEvent
    cursorIndex.current = start < end ? start : start + text.length
  }

  const onChange = (evt: NativeSyntheticEvent<TextInputChangeEventData>) => {
    tmpValue.current = evt.nativeEvent.text
    if (!bindinput) return
    const result = bindinput(
      getCustomEvent(
        'input',
        evt,
        {
          detail: {
            value: evt.nativeEvent.text,
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
  }

  const onInputFocus = (evt: NativeSyntheticEvent<TextInputFocusEventData>) => {
    bindfocus &&
      bindfocus(
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

  const onInputBlur = (evt: NativeSyntheticEvent<TextInputFocusEventData>) => {
    bindblur &&
      bindblur(
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

  const onKeyPress = (evt: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    bindconfirm &&
      evt.nativeEvent.key === 'Enter' &&
      bindconfirm(
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

  const onSubmitEditing = (evt: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    bindconfirm &&
      multiline &&
      bindconfirm(
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

  const onSelectionChange = (evt: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    bindselectionchange &&
      bindselectionchange(
        getCustomEvent(
          'selectionchange',
          evt,
          {
            detail: {
              selectionStart: evt.nativeEvent.selection.start,
              selectionEnd: evt.nativeEvent.selection.end
            },
            layoutRef
          },
          props
        )
      )
  }

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }

  const resetValue = () => {
    setInputValue('')
  }

  const getValue = () => {
    return inputValue
  }

  if (formValuesMap) {
    if (!props.name) {
      throwReactWarning('[Mpx runtime warn]: If a form component is used, the name attribute is required.')
    } else {
      formValuesMap.set(props.name, { getValue, resetValue })
    }
  }

  useUpdateEffect(() => {
    if (!nodeRef?.current) {
      return
    }
    focus
      ? (nodeRef.current as TextInput)?.focus()
      : (nodeRef.current as TextInput)?.blur()
  }, [focus])

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    ...(enableOffset ? { onLayout } : {})
  },
  [
    'enable-offset'
  ],
  {
    layoutRef
  })

  return (
    <TextInput
      {...innerProps}
      keyboardType={keyboardType as KeyboardTypeOptions}
      secureTextEntry={!!password}
      defaultValue={defaultValue}
      value={inputValue}
      maxLength={maxlength === -1 ? undefined : maxlength}
      editable={!disabled}
      autoFocus={!!autoFocus || !!focus}
      returnKeyType={confirmType}
      selection={selection}
      selectionColor={cursorColor}
      blurOnSubmit={!multiline && !confirmHold}
      underlineColorAndroid="rgba(0,0,0,0)"
      textAlignVertical={textAlignVertical}
      placeholderTextColor={placeholderTextColor}
      multiline={!!multiline}
      onTextInput={onTextInput}
      onChange={onChange}
      onFocus={onInputFocus}
      onBlur={onInputBlur}
      onKeyPress={onKeyPress}
      onSubmitEditing={onSubmitEditing}
      onContentSizeChange={onContentSizeChange}
      onSelectionChange={onSelectionChange}
      style={{
        padding: 0,
        ...style,
        ...multiline && autoHeight && {
          height: Math.max((style as any)?.minHeight || 35, contentHeight)
        }
      }
      }
    />
  )
})

Input.displayName = 'MpxInput'

export default Input
