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
import React from 'react'
import { Keyboard } from 'react-native'
import type { Event } from './types'
import Input, { InputProps, LineChangeEventData } from './mpx-input'
import { omit } from './utils'

export interface TextareProps extends InputProps {
  'auto-height'?: boolean
  bindLineChange?: (evt: Event<LineChangeEventData>) => void
}

const Textarea = (props: TextareProps): React.JSX.Element => {
  const restProps = omit(props, ['type', 'password', 'multiline', 'confirm-hold'])
  return <Input multiline confirm-type="next" bindBlur={() => Keyboard.dismiss()} {...restProps} />
}

Textarea.displayName = 'MpxTextarea'

export default Textarea
