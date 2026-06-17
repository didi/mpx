import { View, ViewProps, TextStyle } from 'react-native'
import { createElement } from 'react'
import { splitProps, splitStyle, wrapChildren, extendObject, useTextPassThroughValue, transformBoxSizing, isBoxSizingAffectingStyle } from './utils'
import useInnerProps from './getInnerListeners'
import * as perf from '@mpxjs/perf'

const SimpleView = (simpleViewProps: ViewProps): JSX.Element => {
  let idTotal = -1
  if (__mpx_perf_framework__) idTotal = perf.scopeStart('simple-view:render:total')

  // ───── style 阶段 ─────
  let idStyle = -1
  if (__mpx_perf_framework__) idStyle = perf.scopeStart('simple-view:render:style')
  const { textProps, innerProps: props = {} } = splitProps(simpleViewProps)

  let hasBoxSizingAffectingStyle = false
  const { textStyle, innerStyle = {} } = splitStyle(props.style || {}, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const textPassThrough = useTextPassThroughValue(textStyle as TextStyle, textProps)
  if (__mpx_perf_framework__) perf.scopeEnd(idStyle)

  // ───── innerProps 阶段 ─────
  let idInnerProps = -1
  if (__mpx_perf_framework__) idInnerProps = perf.scopeStart('simple-view:render:innerProps')
  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        style: transformBoxSizing(extendObject({}, innerStyle), hasBoxSizingAffectingStyle)
      }
    )
  )
  if (__mpx_perf_framework__) perf.scopeEnd(idInnerProps)

  // ───── createElement 阶段 ─────
  let idCreate = -1
  if (__mpx_perf_framework__) idCreate = perf.scopeStart('simple-view:render:createElement')
  const result = createElement(View, innerProps, wrapChildren(
    props,
    {
      hasVarDec: false,
      textPassThrough
    }
  ))
  if (__mpx_perf_framework__) perf.scopeEnd(idCreate)

  if (__mpx_perf_framework__) perf.scopeEnd(idTotal)
  return result
}

SimpleView.displayName = 'MpxSimpleView'

export default SimpleView
