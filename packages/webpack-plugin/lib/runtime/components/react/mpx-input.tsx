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

export interface InputProps {
  style?: StyleProp<InputStyle>
  value?: string
  defaultValue?: string
  type?: Type
  password?: boolean
  placeholder?: string
  disabled?: boolean
  maxlength?: number
  autoFocus?: boolean
  focus?: boolean
  confirmType?: 'done' | 'send' | 'search' | 'next' | 'go'
  confirmHold?: boolean
  cursor?: number
  cursorColor?: string
  selectionStart?: number
  selectionEnd?: number
  placeholderStyle?: string
  placeholderTextColor?: string
  onInput?: (evt: Event<InputEventCursorData>) => void
  onFocus?: (evt: Event<InputEventValueData>) => void
  onBlur?: (evt: Event<InputEventCursorData>) => void
  onConfirm?: (evt: Event<InputEventValueData>) => void
}

export interface PrivateInputProps {
  multiline?: boolean
  autoHeight?: boolean
  onLineChange?: (evt: Event<LineChangeEventData>) => void
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
    placeholderStyle,
    disabled,
    maxlength = 140,
    autoFocus,
    focus,
    confirmType = 'done',
    confirmHold = false,
    cursor,
    cursorColor,
    selectionStart = -1,
    selectionEnd = -1,
    onInput,
    onFocus,
    onBlur,
    onConfirm,
    // private
    multiline,
    autoHeight,
    onLineChange,
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
    if (!onInput && !onBlur) return
    const {
      range: { start, end },
      text,
    } = nativeEvent
    cursorIndex.current = start < end ? start : start + text.length
  }

  const onChangeText = useCallback(
    (text: string) => {
      tmpValue.current = text
      if (!onInput) return
      const result = onInput({
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
    [inputValue, onInput]
  )

  const onInputFocus = useCallback(() => {
    if (!onFocus) return
    onFocus({
      detail: {
        value: tmpValue.current || '',
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFocus, inputValue])

  const onInputBlur = useCallback(() => {
    if (!onBlur) return
    onBlur({
      detail: {
        value: tmpValue.current || '',
        cursor: cursorIndex.current,
      },
    })
  }, [onBlur])

  const onKeyPress = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (onConfirm && nativeEvent.key === 'Enter') {
        onConfirm({
          detail: {
            value: tmpValue.current || '',
          },
        })
      }
    },
    [onConfirm]
  )

  const onSubmitEditing = useCallback(() => {
    if (multiline || !onConfirm) return
    onConfirm({
      detail: {
        value: tmpValue.current || '',
      },
    })
  }, [multiline, onConfirm])

  const onContentSizeChange = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const { width, height } = nativeEvent.contentSize
      if (width && height) {
        if (!multiline || !autoHeight || height === contentHeight) return
        lineCount.current += height > contentHeight ? 1 : -1
        onLineChange &&
          onLineChange({
            detail: {
              height,
              lineCount: lineCount.current,
            },
          })
        setContentHeight(height)
      }
    },
    [autoHeight, contentHeight, multiline, onLineChange]
  )

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
