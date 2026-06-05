import { Text, TextStyle, TextProps } from 'react-native'
import { JSX, createElement } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject, getDefaultAllowFontScaling, useTextPassThroughText, wrapChildren, isStringChildren, transformBoxSizing, splitStyle, isBoxSizingAffectingStyle } from './utils'
import * as perf from '@mpxjs/perf'

const SimpleText = (props: TextProps): JSX.Element => {
  let stopTotal: (() => void) | undefined
  if (__mpx_perf_framework__) stopTotal = perf.scope('simple-text:render:total')

  // ───── style 阶段 ─────
  let stopStyle: (() => void) | undefined
  if (__mpx_perf_framework__) stopStyle = perf.scope('simple-text:render:style')
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
  if (__mpx_perf_framework__) stopStyle!()

  // ───── innerProps 阶段 ─────
  let stopInnerProps: (() => void) | undefined
  if (__mpx_perf_framework__) stopInnerProps = perf.scope('simple-text:render:innerProps')
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
  if (__mpx_perf_framework__) stopInnerProps!()

  // ───── createElement 阶段 ─────
  let stopCreate: (() => void) | undefined
  if (__mpx_perf_framework__) stopCreate = perf.scope('simple-text:render:createElement')
  const result = createElement(Text, innerProps, wrapChildren(
    { children },
    {
      hasVarDec: false,
      textPassThrough
    }
  ))
  if (__mpx_perf_framework__) stopCreate!()

  if (__mpx_perf_framework__) stopTotal!()
  return result
}

SimpleText.displayName = 'MpxSimpleText'

export default SimpleText
