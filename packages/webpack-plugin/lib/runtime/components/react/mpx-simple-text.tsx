import { Text, TextStyle, TextProps } from 'react-native'
import { JSX, createElement } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject, getDefaultAllowFontScaling, useTextPassThroughText, wrapChildren, isStringChildren, transformBoxSizing, splitStyle, isBoxSizingAffectingStyle } from './utils'
import * as perf from '@mpxjs/perf'

const SimpleText = (props: TextProps): JSX.Element => {
  let idTotal = -1
  if (__mpx_perf_framework__) idTotal = perf.scopeStart('simple-text:render:total')

  // ───── style 阶段 ─────
  let idStyle = -1
  if (__mpx_perf_framework__) idStyle = perf.scopeStart('simple-text:render:style')
  let hasBoxSizingAffectingStyle = false
  const { textStyle } = splitStyle(props.style || {}, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const isStringOnly = isStringChildren(props.children)
  const childTextStyle: TextStyle | undefined = !isStringOnly ? textStyle as TextStyle : undefined
  const { inheritedText, textPassThrough } = useTextPassThroughText(childTextStyle)
  const mergedStyle = extendObject({}, inheritedText?.textStyle, props.style)
  const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props)
  transformBoxSizing(mergedStyle, hasBoxSizingAffectingStyle)
  const {
    allowFontScaling,
    children
  } = mergedProps
  if (__mpx_perf_framework__) perf.scopeEnd(idStyle)

  // ───── innerProps 阶段 ─────
  let idInnerProps = -1
  if (__mpx_perf_framework__) idInnerProps = perf.scopeStart('simple-text:render:innerProps')
  const innerProps = useInnerProps(
    extendObject(
      {},
      mergedProps,
      {
        allowFontScaling: allowFontScaling ?? getDefaultAllowFontScaling(),
        style: mergedStyle
      }
    )
  )
  if (__mpx_perf_framework__) perf.scopeEnd(idInnerProps)

  // ───── createElement 阶段 ─────
  let idCreate = -1
  if (__mpx_perf_framework__) idCreate = perf.scopeStart('simple-text:render:createElement')
  const result = createElement(Text, innerProps, wrapChildren(
    { children },
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
