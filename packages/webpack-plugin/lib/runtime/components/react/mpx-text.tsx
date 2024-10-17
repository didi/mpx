
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
import { wrapChildren } from './common'

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

const _Text = forwardRef<HandlerRef<Text, _TextProps>, _TextProps>((props, ref): JSX.Element => {
  const {
    style = {},
    selectable,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'user-select': userSelect
  } = props

  const layoutRef = useRef({})

  const {
    normalStyle,
    hasVarDec,
    varContextRef
  } = useTransformStyle(style, { enableVar, externalVarContext })

  const { nodeRef } = useNodesRef<Text, _TextProps>(props, ref)

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

_Text.displayName = 'mpx-text'

export default _Text
