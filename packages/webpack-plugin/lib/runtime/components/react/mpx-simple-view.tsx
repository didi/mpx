import { View, ViewProps, TextStyle } from 'react-native'
import { createElement } from 'react'
import { splitProps, splitStyle, wrapChildren, extendObject, useTextPassThroughValue, transformBoxSizing, isBoxSizingAffectingStyle } from './utils'
import useInnerProps from './getInnerListeners'
import * as perf from '@mpxjs/perf'

const SimpleView = (simpleViewProps: ViewProps): JSX.Element => {
  let stopTotal: (() => void) | undefined
  if (__mpx_perf_framework__) stopTotal = perf.scope('simple-view:render:total')

  // ───── style 阶段 ─────
  let stopStyle: (() => void) | undefined
  if (__mpx_perf_framework__) stopStyle = perf.scope('simple-view:render:style')
  const { textProps, innerProps: props = {} } = splitProps(simpleViewProps)

  let hasBoxSizingAffectingStyle = false
  const { textStyle, innerStyle = {} } = splitStyle(props.style || {}, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const textPassThrough = useTextPassThroughValue(textStyle as TextStyle, textProps)
  if (__mpx_perf_framework__) stopStyle!()

  // ───── innerProps 阶段 ─────
  let stopInnerProps: (() => void) | undefined
  if (__mpx_perf_framework__) stopInnerProps = perf.scope('simple-view:render:innerProps')
  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        style: transformBoxSizing(extendObject({}, innerStyle), hasBoxSizingAffectingStyle)
      }
    )
  )
  if (__mpx_perf_framework__) stopInnerProps!()

  // ───── createElement 阶段 ─────
  let stopCreate: (() => void) | undefined
  if (__mpx_perf_framework__) stopCreate = perf.scope('simple-view:render:createElement')
  const result = createElement(View, innerProps, wrapChildren(
    props,
    {
      hasVarDec: false,
      textPassThrough
    }
  ))
  if (__mpx_perf_framework__) stopCreate!()

  if (__mpx_perf_framework__) stopTotal!()
  return result
}

SimpleView.displayName = 'MpxSimpleView'

export default SimpleView
