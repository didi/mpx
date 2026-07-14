import { Text, TextStyle, TextProps } from 'react-native'
import { JSX, createElement, useContext, useRef } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject, getDefaultAllowFontScaling, wrapChildren, isStringChildren, transformBoxSizing, splitStyle, isBoxSizingAffectingStyle, resolveTextFontSizePercentStyle, resolveTextLineHeightPercentStyle } from './utils'
import * as perf from '@mpxjs/perf'
import { diffAndCloneA } from '@mpxjs/utils'
import { TextPassThroughContext, TextPassThroughContextValue } from './context'

const SimpleText = (props: TextProps): JSX.Element => {
  let idTotal = -1
  if (__mpx_perf_framework__) idTotal = perf.scopeStart('simple-text:render:total')

  // ───── style 阶段 ─────
  let idStyle = -1
  if (__mpx_perf_framework__) idStyle = perf.scopeStart('simple-text:render:style')
  let hasBoxSizingAffectingStyle = false
  const { textStyle } = splitStyle(props.style as TextStyle | undefined, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const inheritedText = useContext(TextPassThroughContext)
  const resolvedTextStyle = resolveTextFontSizePercentStyle(textStyle, inheritedText?.textStyle)
  // textStyle 仅在子节点非纯字符串时才需要透传给子级；按需计算 isStringChildren
  const childTextStyle = resolvedTextStyle && !isStringChildren(props.children)
    ? resolvedTextStyle
    : undefined
  const textPassThroughRef = useRef<TextPassThroughContextValue | null>(null)
  let textPassThrough: TextPassThroughContextValue | null = null
  if (childTextStyle) {
    const nextTextPassThrough = {
      textStyle: extendObject({}, inheritedText?.textStyle, childTextStyle)
    }
    if (diffAndCloneA(textPassThroughRef.current, nextTextPassThrough).diff) {
      textPassThroughRef.current = nextTextPassThrough
    }
    textPassThrough = textPassThroughRef.current
  }

  const mergedProps = inheritedText?.pendingTextProps
    ? extendObject({}, inheritedText.pendingTextProps, props)
    : props
  const mergedStyle = inheritedText?.textStyle || props.style
    ? extendObject({}, inheritedText?.textStyle, props.style, resolvedTextStyle) as TextStyle
    : undefined
  if (mergedStyle) {
    resolveTextLineHeightPercentStyle(mergedStyle, inheritedText?.textStyle)
    if (hasBoxSizingAffectingStyle) transformBoxSizing(mergedStyle as Record<string, any>)
  }
  if (__mpx_perf_framework__) perf.scopeEnd(idStyle)

  // ───── innerProps 阶段 ─────
  let idInnerProps = -1
  if (__mpx_perf_framework__) idInnerProps = perf.scopeStart('simple-text:render:innerProps')
  const innerProps = useInnerProps(
    extendObject(
      {},
      mergedProps,
      {
        allowFontScaling: mergedProps.allowFontScaling ?? getDefaultAllowFontScaling(),
        style: mergedStyle
      }
    )
  )
  if (__mpx_perf_framework__) perf.scopeEnd(idInnerProps)

  // ───── createElement 阶段 ─────
  let idCreate = -1
  if (__mpx_perf_framework__) idCreate = perf.scopeStart('simple-text:render:createElement')
  const result = createElement(Text, innerProps, wrapChildren(
    mergedProps.children,
    {
      hasVarDec: false,
      textPassThrough
    }
  ))
  if (__mpx_perf_framework__) perf.scopeEnd(idCreate)

  if (__mpx_perf_framework__) perf.scopeEnd(idTotal)
  return result
}

SimpleText.displayName = 'MpxSimpleText'

export default SimpleText
