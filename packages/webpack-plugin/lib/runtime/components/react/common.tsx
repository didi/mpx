import { TextStyle } from 'react-native'
import { Children, cloneElement } from 'react'
import { VarContext } from './context'
import { isText } from './utils'

export interface WrapChildrenConfig {
  hasVarDec: boolean
  varContext?: Record<string, any>
}

interface TextConfig {
  textStyle?: TextStyle
  textProps?: Record<string, any>
}

export function wrapChildren (props: Record<string, any> = {}, { hasVarDec, varContext }: WrapChildrenConfig, { textStyle, textProps } : TextConfig = {}) {
  let { children } = props
  if (textStyle || textProps) {
    children = Children.map(children, (child) => {
      if (isText(child)) {
        const style = { ...textStyle, ...child.props.style }
        return cloneElement(child, { ...textProps, style })
      }
      return child
    })
  }
  if (hasVarDec && varContext) {
    children = <VarContext.Provider value={varContext}>{children}</VarContext.Provider>
  }
  return children
}