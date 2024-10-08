
/**
 * ✔ selectable
 * ✘ space
 * ✘ decode
 */
import { Text, TextStyle, TextProps } from 'react-native'
import { useRef, useEffect, forwardRef, ReactNode, JSX } from 'react'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { DEFAULT_FONT_SIZE, useTransformStyle } from './utils'
import { VarContext } from './context'

interface _TextProps extends TextProps {
  style?: TextStyle
  children?: ReactNode
  selectable?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'user-select'?: boolean
  userSelect?: boolean
  'disable-default-style'?: boolean
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
    children,
    selectable,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'user-select': userSelect,
    'disable-default-style': disableDefaultStyle = false
  } = props

  const layoutRef = useRef({})

  const defaultStyle: TextStyle = {}

  if (!disableDefaultStyle) {
    defaultStyle.fontSize = DEFAULT_FONT_SIZE
  }

  const styleObj: TextStyle = {
    ...defaultStyle,
    ...style
  }
  const {
    normalStyle,
    hasVarDec,
    varContextRef
  } = useTransformStyle(styleObj, { enableVar, externalVarContext, enablePercent: false })

  const { nodeRef } = useNodesRef<Text, _TextProps>(props, ref, {
    defaultStyle
  })

  const innerProps = useInnerProps(props, {
    ref: nodeRef
  }, [
    'style',
    'children',
    'selectable',
    'user-select',
    'useInherit',
    'enable-offset'
  ], {
    layoutRef
  })

  return (
    <Text
      style={normalStyle}
      selectable={!!selectable || !!userSelect}
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

_Text.displayName = '_mpxText'

export default _Text
