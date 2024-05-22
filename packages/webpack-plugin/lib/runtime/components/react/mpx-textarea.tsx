/**
 * Compared with Input:
 *   Subtraction:
 *     type, password, confirm-hold
 *   Addition:
 *     - confirm-type: Not support `return`
 *     ✔ auto-height
 *     ✘ fixed
 *     ✘ show-confirm-bar
 *     ✔ bindlinechange: No `heightRpx` info.
 */
import React, { forwardRef } from 'react'
import { Keyboard, TextInput } from 'react-native'
import Input, { InputProps, PrivateInputProps } from './mpx-input'
import { omit } from './utils'

export type TextareProps = Omit<InputProps & PrivateInputProps, 'type' | 'password' | 'pass' | 'confirm-hold'>

const Textarea = forwardRef<TextInput, TextareProps>((props, ref): React.JSX.Element => {
  const restProps = omit(props, ['type', 'password', 'multiline', 'confirm-hold'])
  return <Input multiline confirm-type="next" bindblur={() => Keyboard.dismiss()} {...restProps} ref={ref} />
})

Textarea.displayName = 'mpx-textarea'

export default Textarea
