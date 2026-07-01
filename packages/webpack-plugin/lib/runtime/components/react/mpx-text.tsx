
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

function getDecodedChildren (children: ReactNode): { children: ReactNode, isStringOnly: boolean } {
  if (typeof children === 'string') {
    return { children: decode(children), isStringOnly: true }
  }
  let isStringOnly = true
  const decoded = Children.map(children, (child) => {
    if (typeof child === 'string') return decode(child)
    isStringOnly = false
    return child
  })
  return { children: decoded, isStringOnly }
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
  let idTotal = -1
  if (__mpx_perf_framework__) idTotal = perf.scopeStart('text:render:total')

  // ───── props 阶段 ─────
  let idProps = -1
  if (__mpx_perf_framework__) idProps = perf.scopeStart('text:render:props')
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
  if (__mpx_perf_framework__) perf.scopeEnd(idProps)

  // ───── style 阶段 ─────
  let idStyle = -1
  if (__mpx_perf_framework__) idStyle = perf.scopeStart('text:render:style')
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

  let children: ReactNode
  let isStringOnly: boolean
  if (decode) {
    ({ children, isStringOnly } = getDecodedChildren(props.children))
  } else {
    children = props.children
    isStringOnly = isStringChildren(children)
  }
  const childTextStyle = !isStringOnly ? (splitStyle(normalStyle).textStyle as TextStyle | undefined) : undefined
  const { inheritedText, textPassThrough } = useTextPassThroughText(childTextStyle)

  const mergedProps = inheritedText?.pendingTextProps
    ? extendObject({}, inheritedText.pendingTextProps, props)
    : props
  const finalStyle = inheritedText?.textStyle
    ? extendObject({}, inheritedText.textStyle, normalStyle)
    : normalStyle

  const nodeRef = useRef(null)
  useNodesRef<Text, _TextProps>(mergedProps, ref, nodeRef, {
    style: finalStyle
  })
  if (__mpx_perf_framework__) perf.scopeEnd(idStyle)

  // ───── innerProps 阶段 ─────
  let idInnerProps = -1
  if (__mpx_perf_framework__) idInnerProps = perf.scopeStart('text:render:innerProps')
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
  if (__mpx_perf_framework__) perf.scopeEnd(idInnerProps)

  // ───── createElement 阶段 ─────
  let idCreate = -1
  if (__mpx_perf_framework__) idCreate = perf.scopeStart('text:render:createElement')
  let finalComponent:JSX.Element = createElement(Text, innerProps, wrapChildren(
    children,
    {
      hasVarDec,
      varContext: varContextRef.current,
      textPassThrough
    }
  ))

  if (hasPositionFixed) {
    finalComponent = createElement(Portal, null, finalComponent)
  }
  if (__mpx_perf_framework__) perf.scopeEnd(idCreate)

  if (__mpx_perf_framework__) perf.scopeEnd(idTotal)
  return finalComponent
})

_Text.displayName = 'MpxText'

export default _Text
