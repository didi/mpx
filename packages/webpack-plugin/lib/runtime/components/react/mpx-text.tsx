
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
import * as perf from '@mpxjs/perf'

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
  let stopTotal: (() => void) | undefined
  if (__mpx_perf_framework__) stopTotal = perf.scope('text:render:total')

  // ───── props 阶段 ─────
  let stopProps: (() => void) | undefined
  if (__mpx_perf_framework__) stopProps = perf.scope('text:render:props')
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
  if (__mpx_perf_framework__) stopProps!()

  // ───── style 阶段 ─────
  let stopStyle: (() => void) | undefined
  if (__mpx_perf_framework__) stopStyle = perf.scope('text:render:style')
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
  if (__mpx_perf_framework__) stopStyle!()

  // ───── innerProps 阶段 ─────
  let stopInnerProps: (() => void) | undefined
  if (__mpx_perf_framework__) stopInnerProps = perf.scope('text:render:innerProps')
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
  if (__mpx_perf_framework__) stopInnerProps!()

  // ───── createElement 阶段 ─────
  let stopCreate: (() => void) | undefined
  if (__mpx_perf_framework__) stopCreate = perf.scope('text:render:createElement')
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
  if (__mpx_perf_framework__) stopCreate!()

  if (__mpx_perf_framework__) stopTotal!()
  return finalComponent
})

_Text.displayName = 'MpxText'

export default _Text
