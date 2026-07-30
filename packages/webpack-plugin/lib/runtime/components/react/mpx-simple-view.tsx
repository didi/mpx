import { View, ViewProps, TextStyle } from 'react-native'
import { createElement } from 'react'
import { splitProps, splitStyle, wrapChildren, extendObject, useTextPassThrough, transformBoxSizing, isBoxSizingAffectingStyle } from './utils'
import useInnerProps from './getInnerListeners'
import * as perf from '@mpxjs/perf'

interface SimpleViewProps extends ViewProps {
  'enable-text-pass-through'?: boolean
}

const SimpleView = (simpleViewProps: SimpleViewProps): JSX.Element => {
  let idTotal = -1
  if (__mpx_perf_framework__) idTotal = perf.scopeStart('simple-view:render:total')

  // ───── style 阶段 ─────
  let idStyle = -1
  if (__mpx_perf_framework__) idStyle = perf.scopeStart('simple-view:render:style')
  const { textProps, innerProps: props = {} } = splitProps(simpleViewProps)
  const enableTextPassThrough = props['enable-text-pass-through']

  let hasBoxSizingAffectingStyle = false
  const { textStyle, innerStyle = {} } = splitStyle(props.style || {}, (key) => {
    if (!hasBoxSizingAffectingStyle && isBoxSizingAffectingStyle(key)) {
      hasBoxSizingAffectingStyle = true
    }
  })
  const textPassThrough = useTextPassThrough(textStyle as TextStyle, textProps, { enableTextPassThrough })

  let styleObj: Record<string, any> = innerStyle
  if (hasBoxSizingAffectingStyle) {
    // 复制一次再 mutate，避免污染 splitStyle 复用的原 props.style
    styleObj = extendObject({}, innerStyle)
    transformBoxSizing(styleObj)
  }
  if (__mpx_perf_framework__) perf.scopeEnd(idStyle)

  // ───── innerProps 阶段 ─────
  let idInnerProps = -1
  if (__mpx_perf_framework__) idInnerProps = perf.scopeStart('simple-view:render:innerProps')
  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        style: styleObj
      }
    )
  )
  if (__mpx_perf_framework__) perf.scopeEnd(idInnerProps)

  // ───── createElement 阶段 ─────
  let idCreate = -1
  if (__mpx_perf_framework__) idCreate = perf.scopeStart('simple-view:render:createElement')
  const result = createElement(View, innerProps, wrapChildren(
    props.children,
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
