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

export type AnyFunc = (...args: ReadonlyArray<any>) => any

declare global {
  interface PageConfig {
    /**
     * 是否自定义导航栏
     */
    navigationStyle?: 'custom'
    /**
     * 标题栏样式
     */
    navigationBarTextStyle?: 'white' | 'black' | '#ffffff' | '#000000'
    /**
     * 页面标题
     */
    navigationBarTitleText?: string

    [key: string]: any
  }
}
