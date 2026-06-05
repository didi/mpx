import { Text, TextStyle, TextProps } from 'react-native'
import { JSX, createElement, useContext } from 'react'
import useInnerProps from './getInnerListeners'
import { extendObject, getDefaultAllowFontScaling, useTextPassThroughValue, wrapChildren, isStringChildren, transformBoxSizing, splitStyle, isBoxSizingAffectingStyle } from './utils'
import { TextPassThroughContext } from './context'
import * as perf from '@mpxjs/perf'

const SimpleText = (props: TextProps): JSX.Element => {
  let stopTotal: (() => void) | undefined
  if (__mpx_perf_framework__) stopTotal = perf.scope('simple-text:render:total')

  // ───── style 阶段 ─────
  let stopStyle: (() => void) | undefined
  if (__mpx_perf_framework__) stopStyle = perf.scope('simple-text:render:style')
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
        style: finalStyle
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
      textPassThrough: childTextPassThrough
    }
  ))
  if (__mpx_perf_framework__) stopCreate!()

  if (__mpx_perf_framework__) stopTotal!()
  return result
}

SimpleText.displayName = 'MpxSimpleText'

export default SimpleText
