import { ViewStyle } from 'react-native'
import { FunctionComponent } from 'react'

type NumberVal = number | `${number}%`
type backgroundPositionList = ['left' | 'right', NumberVal, 'top' | 'bottom', NumberVal] | []

export type ExtendedViewStyle = ViewStyle & {
  backgroundImage?: string
  backgroundSize?: Array<NumberVal | 'auto' | 'contain' | 'cover'>
  borderRadius?: string | number
  backgroundPosition?: backgroundPositionList
  [key: string]: any
  transform?: {[key: string]: number | string}[]
}

export type ExtendedFunctionComponent = FunctionComponent & {
  isCustomText?: boolean
}
