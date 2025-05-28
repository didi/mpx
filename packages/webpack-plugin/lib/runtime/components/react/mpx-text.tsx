
/**
 * ✔ selectable
 * ✘ space
 * ✘ decode
 */
import { Text, TextStyle, TextProps } from 'react-native'
import { useRef, forwardRef, ReactNode, JSX, createElement } from 'react'
import Portal from './mpx-portal'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { useTransformStyle, wrapChildren, extendObject } from './utils'

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

const _Text = forwardRef<HandlerRef<Text, _TextProps>, _TextProps>((props, ref): JSX.Element => {
  const {
    style = {},
    allowFontScaling = false,
    selectable,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'user-select': userSelect,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasPositionFixed
  } = useTransformStyle(style, {
    enableVar,
    externalVarContext,
    parentFontSize,
    parentWidth,
    parentHeight
  })

  const nodeRef = useRef(null)
  useNodesRef<Text, _TextProps>(props, ref, nodeRef, {
    style: normalStyle
  })

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        ref: nodeRef,
        style: normalStyle,
        selectable: !!selectable || !!userSelect,
        allowFontScaling
      }
    ),
    [
      'user-select'
    ]
  )

  let finalComponent:JSX.Element = createElement(Text, innerProps, wrapChildren(
    props,
    {
      hasVarDec,
      varContext: varContextRef.current
    }
  ))

  if (hasPositionFixed) {
    finalComponent = createElement(Portal, null, finalComponent)
  }

  return finalComponent
})

_Text.displayName = 'MpxText'

export default _Text
