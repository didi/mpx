import React from 'react'
import { Keyboard } from 'react-native'
import type { Event } from './types'
import Input, { InputProps, LineChangeEventData } from './mpx-input'
import { omit } from './utils'

export interface TextareProps extends InputProps {
  autoHeight?: boolean
  bindLineChange?: (evt: Event<LineChangeEventData>) => void
}

const Textarea = (props: TextareProps): React.JSX.Element => {
  const restProps = omit(props, ['type', 'password', 'multiline', 'confirmType', 'confirmHold'])
  return <Input multiline confirmType="next" bindBlur={() => Keyboard.dismiss()} {...restProps} />
}

Textarea.displayName = 'MpxTextarea'

export default Textarea
