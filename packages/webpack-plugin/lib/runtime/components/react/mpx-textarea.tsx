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
import { Keyboard, NativeSyntheticEvent, TextInput, TextInputContentSizeChangeEventData } from 'react-native'
import Input, { InputProps } from './mpx-input'
import { omit } from './utils'

export interface TextareProps extends InputProps {
  'auto-height'?: boolean
  bindlineChange?: (evt: NativeSyntheticEvent<TextInputContentSizeChangeEventData> | unknown) => void
}

const Textarea = forwardRef<TextInput, TextareProps>((props, ref): React.JSX.Element => {
  const restProps = omit(props, ['ref', 'type', 'password', 'multiline', 'confirm-hold'])
  return <Input ref={ref} multiline confirm-type="next" bindblur={() => Keyboard.dismiss()} {...restProps} />
})

Textarea.displayName = '_Textarea'

export default Textarea
