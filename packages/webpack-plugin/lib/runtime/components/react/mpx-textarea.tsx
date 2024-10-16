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
import { JSX, forwardRef } from 'react'
import { Keyboard, TextInput } from 'react-native'
import Input, { InputProps, PrivateInputProps } from './mpx-input'
import { omit } from './utils'
import { HandlerRef } from './useNodesRef'

export type TextareProps = Omit<
  InputProps & PrivateInputProps,
  'type' | 'password' | 'multiline' | 'confirm-hold'
>

const Textarea = forwardRef<HandlerRef<TextInput, TextareProps>, TextareProps>(
  (props, ref): JSX.Element => {
    const restProps = omit(props, [
      'ref',
      'type',
      'password',
      'multiline',
      'confirm-hold'
    ])
    return (
      <Input
        ref={ref}
        multiline
        confirm-type='next'
        bindblur={() => Keyboard.dismiss()}
        {...restProps}
      />
    )
  }
)

Textarea.displayName = 'MpxTextarea'

export default Textarea
