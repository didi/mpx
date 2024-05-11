/**
 * Compared with Input:
 *   Subtraction:
 *     type, password, confirm-hold
 *   Addition:
 *     - confirm-type: Not surpport `return`
 *     ✔ auto-height
 *     ✘ fixed
 *     ✘ show-confirm-bar
 *     ✔ bindlinechange: No `heightRpx` info.
 */
import React, { forwardRef } from 'react'
import { Keyboard, TextInput } from 'react-native'
import type { Event } from './types'
import Input, { InputProps, LineChangeEventData } from './mpx-input'
import { omit } from './utils'

export interface TextareProps extends InputProps {
  'auto-height'?: boolean
  bindLineChange?: (evt: Event<LineChangeEventData>) => void
}

const Textarea = forwardRef<TextInput, TextareProps>((props, ref): React.JSX.Element => {
  const restProps = omit(props, ['ref', 'type', 'password', 'multiline', 'confirm-hold'])
  return <Input ref={ref} multiline confirm-type="next" bindBlur={() => Keyboard.dismiss()} {...restProps} />
})

Textarea.displayName = '_Textarea'

export default Textarea
