import { Text, TextStyle, TextProps } from 'react-native'
import { JSX, createElement, useContext } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject, getDefaultAllowFontScaling, useTextPassThroughValue, wrapChildren, isStringChildren, transformBoxSizing, splitStyle, isBoxSizingAffectingStyle } from './utils'
import { TextPassThroughContext } from './context'
import * as perf from '@mpxjs/perf'

const SimpleText = (props: TextProps): JSX.Element => {
  let idTotal = -1
  if (__mpx_perf_framework__) idTotal = perf.scopeStart('simple-text:render:total')

  // ───── style 阶段 ─────
  let idStyle = -1
  if (__mpx_perf_framework__) idStyle = perf.scopeStart('simple-text:render:style')
  const inheritedText = useContext(TextPassThroughContext)
  const mergedStyle = extendObject({}, inheritedText?.textStyle, props.style)
  let hasBoxSizingAffectingStyle = false
  const { textStyle = {} } = splitStyle(mergedStyle, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const finalStyle = transformBoxSizing(mergedStyle, hasBoxSizingAffectingStyle)
  const mergedProps = extendObject({}, inheritedText?.pendingTextProps, props)
  const {
    allowFontScaling,
    children
  } = mergedProps
  const isStringOnly = isStringChildren(children)
  const childTextStyle: TextStyle | undefined = !isStringOnly && Object.keys(textStyle).length ? textStyle : undefined
  const childTextPassThrough = useTextPassThroughValue(
    childTextStyle,
    undefined,
    {
      inheritTextProps: false,
      disabled: isStringOnly
    }
  )
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
        style: finalStyle
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
      textPassThrough: childTextPassThrough
    }
  ))
  if (__mpx_perf_framework__) perf.scopeEnd(idCreate)

  if (__mpx_perf_framework__) perf.scopeEnd(idTotal)
  return result
}

SimpleText.displayName = 'MpxSimpleText'

export default SimpleText
