import React from 'react'
import { Keyboard } from 'react-native'
import type { Event } from '../types'
import Input, { InputProps, LineChangeEventData } from '../Input'
import { omit } from '../utils'

export interface TextareProps extends InputProps {
  autoHeight?: boolean
  onLineChange?: (evt: Event<LineChangeEventData>) => void
}

const Textarea = (props: TextareProps): React.JSX.Element => {
  const restProps = omit(props, ['type', 'password', 'multiline', 'confirmType', 'confirmHold'])
  return <Input multiline confirmType="next" onBlur={() => Keyboard.dismiss()} {...restProps} />
}

export default Textarea
