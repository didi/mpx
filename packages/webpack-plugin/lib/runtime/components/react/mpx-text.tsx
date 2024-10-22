
/**
 * ✔ selectable
 * ✘ space
 * ✘ decode
 */
import { Text, TextStyle, TextProps } from 'react-native'
import { useRef, forwardRef, ReactNode, JSX } from 'react'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { useTransformStyle } from './utils'
import { VarContext } from './context'

interface _TextProps extends TextProps {
  style?: TextStyle
  children?: ReactNode
  selectable?: boolean
  'user-select'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
}

interface WrapChildrenConfig {
  hasVarDec: boolean
  varContext?: Record<string, any>
}

function wrapChildren (props: TextProps, { hasVarDec, varContext }: WrapChildrenConfig) {
  let { children } = props
  if (hasVarDec && varContext) {
    children = <VarContext.Provider value={varContext}>{children}</VarContext.Provider>
  }
  return children
}

const _Text = forwardRef<HandlerRef<Text, _TextProps>, _TextProps>((props, ref): JSX.Element => {
  const {
    style = {},
    selectable,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'user-select': userSelect,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  const layoutRef = useRef({})

  const {
    normalStyle,
    hasVarDec,
    varContextRef
  } = useTransformStyle(style, {
    enableVar,
    externalVarContext,
    parentFontSize,
    parentWidth,
    parentHeight
  })

  const { nodeRef } = useNodesRef<Text, _TextProps>(props, ref)

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    style: normalStyle,
    selectable: !!selectable || !!userSelect
  }, [
    'user-select'
  ], {
    layoutRef
  })

  return (
    <Text
      {...innerProps}
    >
      {
        wrapChildren(
          props,
          {
            hasVarDec,
            varContext: varContextRef.current
          }
        )
      }
    </Text>
  )
})

_Text.displayName = 'mpx-text'

export default _Text
