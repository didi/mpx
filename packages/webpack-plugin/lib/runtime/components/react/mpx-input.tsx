/**
 * ✔ value
 * ✔ defaultValue
 * - type: Partially. Not surpport safe-password、nickname
 * ✔ password
 * ✔ placeholder
 * - placeholder-style: Only placeholderTextColor(RN).
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
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  KeyboardTypeOptions,
  Platform,
  StyleProp,
  TextInput,
  TextStyle,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputTextInputEventData,
  TextInputKeyPressEventData,
  TextInputContentSizeChangeEventData,
  FlexStyle,
  TextInputSelectionChangeEventData,
} from 'react-native'
import { Event } from './types'
import { parseInlineStyle, useUpdateEffect } from './utils'

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

type InputEventValueData = {
  value: string
}

type InputEventCursorData = InputEventValueData & {
  cursor: number
}

export type LineChangeEventData = {
  height: number
  lineCount: number
}

type InputEventSelectionChangeEventData = {
  selectionStart: number
  selectionEnd: number
}

export interface InputProps {
  style?: StyleProp<InputStyle>
  value?: string
  defaultValue?: string
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
  placeholderTextColor?: string
  bindInput?: (evt: Event<InputEventCursorData>) => void
  bindFocus?: (evt: Event<InputEventValueData>) => void
  bindBlur?: (evt: Event<InputEventCursorData>) => void
  bindConfirm?: (evt: Event<InputEventValueData>) => void
  bindSelectionChange?: (evt: Event<InputEventSelectionChangeEventData>) => void
}

export interface PrivateInputProps {
  multiline?: boolean
  'auto-height'?: boolean
  bindLineChange?: (evt: Event<LineChangeEventData>) => void
}

const keyboardTypeMap: Record<Type, string> = {
  text: 'default',
  number: 'numeric',
  idcard: 'default',
  digit:
    Platform.select({
      ios: 'decimal-pad',
      android: 'numeric',
    }) || '',
}

const Input = (props: InputProps & PrivateInputProps): React.JSX.Element => {
  const {
    style,
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
    bindInput,
    bindFocus,
    bindBlur,
    bindConfirm,
    bindSelectionChange,
    // private
    multiline,
    'auto-height': autoHeight,
    bindLineChange,
    ...restProps
  } = props

  const keyboardType = keyboardTypeMap[type]
  const defaultValue = props.defaultValue ?? (type === 'number' && value ? value + '' : value)
  const placeholderTextColor = props.placeholderTextColor || parseInlineStyle(placeholderStyle)?.color
  const textAlignVertical = multiline ? 'top' : 'auto'

  const inputRef = useRef<any>()
  const tmpValue = useRef<string>()
  const cursorIndex = useRef<number>(0)
  const lineCount = useRef<number>(1)

  const [inputValue, setInputValue] = useState()
  const [contentHeight, setContentHeight] = useState(0)

  const selection = useMemo(() => {
    if (selectionStart >= 0 && selectionEnd >= 0) {
      return { start: selectionStart, end: selectionEnd }
    } else if (typeof cursor === 'number') {
      return { start: cursor, end: cursor }
    }
  }, [cursor, selectionStart, selectionEnd])

  const onTextInput = ({ nativeEvent }: NativeSyntheticEvent<TextInputTextInputEventData>) => {
    if (!bindInput && !bindBlur) return
    const {
      range: { start, end },
      text,
    } = nativeEvent
    cursorIndex.current = start < end ? start : start + text.length
  }

  const onChangeText = useCallback(
    (text: string) => {
      tmpValue.current = text
      if (!bindInput) return
      const result = bindInput({
        detail: {
          value: text,
          cursor: cursorIndex.current,
        },
      })
      if (typeof result === 'string') {
        tmpValue.current = result
        setInputValue(result)
      } else if (inputValue) {
        setInputValue(undefined)
      }
    },
    [inputValue, bindInput]
  )

  const onInputFocus = useCallback(() => {
    if (!bindFocus) return
    bindFocus({
      detail: {
        value: tmpValue.current || '',
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindFocus, inputValue])

  const onInputBlur = useCallback(() => {
    if (!bindBlur) return
    bindBlur({
      detail: {
        value: tmpValue.current || '',
        cursor: cursorIndex.current,
      },
    })
  }, [bindBlur])

  const onKeyPress = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (bindConfirm && nativeEvent.key === 'Enter') {
        bindConfirm({
          detail: {
            value: tmpValue.current || '',
          },
        })
      }
    },
    [bindConfirm]
  )

  const onSubmitEditing = useCallback(() => {
    if (multiline || !bindConfirm) return
    bindConfirm({
      detail: {
        value: tmpValue.current || '',
      },
    })
  }, [multiline, bindConfirm])

  const onContentSizeChange = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const { width, height } = nativeEvent.contentSize
      if (width && height) {
        if (!multiline || !autoHeight || height === contentHeight) return
        lineCount.current += height > contentHeight ? 1 : -1
        bindLineChange &&
          bindLineChange({
            detail: {
              height,
              lineCount: lineCount.current,
            },
          })
        setContentHeight(height)
      }
    },
    [autoHeight, contentHeight, multiline, bindLineChange]
  )

  const onSelectionChange = ({
    nativeEvent: {
      selection: { start, end },
    },
  }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    bindSelectionChange &&
      bindSelectionChange({
        detail: {
          selectionStart: start,
          selectionEnd: end,
        },
      })
  }

  useUpdateEffect(() => {
    if (!inputRef.current) {
      return
    }
    focus ? inputRef.current.focus() : inputRef.current.blur()
  }, [focus])

  return (
    <TextInput
      {...restProps}
      ref={inputRef}
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
      blurOnSubmit={!confirmHold}
      underlineColorAndroid="rgba(0,0,0,0)"
      textAlignVertical={textAlignVertical}
      placeholderTextColor={placeholderTextColor}
      multiline={!!multiline}
      onTextInput={onTextInput}
      onChangeText={onChangeText}
      onFocus={onInputFocus}
      onBlur={onInputBlur}
      onKeyPress={onKeyPress}
      onSubmitEditing={onSubmitEditing}
      onContentSizeChange={onContentSizeChange}
      onSelectionChange={onSelectionChange}
      style={[
        {
          padding: 0,
        },
        style,
        multiline &&
          autoHeight && {
            height: Math.max((style as any)?.minHeight || 35, contentHeight),
          },
      ]}
    />
  )
}

Input.displayName = 'MpxInput'

export default Input
