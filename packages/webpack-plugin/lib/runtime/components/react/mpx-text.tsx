
/**
 * ✔ selectable
 * ✘ space
 * ✔ decode
 */
import { Text, TextStyle, TextProps } from 'react-native'
import { useRef, forwardRef, ReactNode, JSX, createElement, Children } from 'react'
import Portal from './mpx-portal'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { useTransformStyle, wrapChildren, extendObject, getDefaultAllowFontScaling, useTextPassThroughText, isStringChildren, splitStyle } from './utils'

const decodeMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#39;': '\'',
  '&nbsp;': ' '
}

const encodedRe = /&(?:lt|gt|quot|amp|#39|nbsp);/g
function decode (value: string) {
  if (value != null) {
    return value.replace(encodedRe, function (match) {
      return decodeMap[match as keyof typeof decodeMap]
    })
  }
}

function getDecodedChildren (children: ReactNode) {
  return Children.map(children, (child) => {
    if (typeof child === 'string') {
      return decode(child)
    }
    return child
  })
}
interface _TextProps extends TextProps {
  style?: TextStyle
  children?: ReactNode
  selectable?: boolean
  'user-select'?: boolean
  'enable-var'?: boolean
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  decode?: boolean
}

const _Text = forwardRef<HandlerRef<Text, _TextProps>, _TextProps>((props, ref): JSX.Element => {
  const {
    style: currentStyle = {},
    allowFontScaling,
    selectable,
    'enable-var': enableVar,
    'user-select': userSelect,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    decode
  } = props

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasPositionFixed
  } = useTransformStyle(currentStyle, {
    enableVar,
    parentFontSize,
    parentWidth,
    parentHeight
  })

  const children = decode ? getDecodedChildren(props.children) : props.children
  const isStringOnly = isStringChildren(children)
  const { textStyle } = splitStyle(normalStyle)
  const { inheritedText, textPassThrough } = useTextPassThroughText(!isStringOnly ? textStyle : undefined)

  const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props)
  const finalStyle = extendObject({}, inheritedText?.textStyle, normalStyle)

  const nodeRef = useRef(null)
  useNodesRef<Text, _TextProps>(mergedProps, ref, nodeRef, {
    style: finalStyle
  })

  const innerProps = useInnerProps(
    extendObject(
      {},
      mergedProps,
      {
        ref: nodeRef,
        style: finalStyle,
        selectable: !!selectable || !!userSelect,
        allowFontScaling: allowFontScaling ?? getDefaultAllowFontScaling()
      }
    ),
    [
      'user-select',
      'decode'
    ]
  )

  let finalComponent:JSX.Element = createElement(Text, innerProps, wrapChildren(
    extendObject({}, mergedProps, {
      children
    }),
    {
      hasVarDec,
      varContext: varContextRef.current,
      textPassThrough
    }
  ))

  if (hasPositionFixed) {
    finalComponent = createElement(Portal, null, finalComponent)
  }

  return finalComponent
})

_Text.displayName = 'MpxText'

export default _Text
