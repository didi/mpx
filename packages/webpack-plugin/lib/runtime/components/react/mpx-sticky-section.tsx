
import { useRef, forwardRef, createElement, ReactNode } from 'react'
import { View, ViewStyle } from 'react-native'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useTransformStyle, wrapChildren, useLayout, extendObject } from './utils'
import useInnerProps from './getInnerListeners'

interface StickySectionProps {
  children?: ReactNode;
  style?: ViewStyle;
  'offset-top'?: number;
  'enable-var'?: boolean;
  'external-var-context'?: Record<string, any>;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
}

const _StickySection = forwardRef<HandlerRef<View, StickySectionProps>, StickySectionProps>((stickySectionProps: StickySectionProps = {}, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(stickySectionProps)
  const {
    style,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props
  const sectionRef = useRef<View>(null)

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { layoutRef, layoutProps, layoutStyle } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: sectionRef })

  const { textStyle, innerStyle = {} } = splitStyle(normalStyle)

  useNodesRef(props, ref, sectionRef, {
    style: normalStyle
  })

  const innerProps = useInnerProps(props, extendObject({
    style: extendObject(innerStyle, layoutStyle),
    ref: sectionRef
  }, layoutProps), [], { layoutRef })

  return (
    createElement(
      View,
      innerProps,
      wrapChildren(
        props,
        {
          hasVarDec,
          varContext: varContextRef.current,
          textStyle,
          textProps
        }
      )
    )
  )
})

_StickySection.displayName = 'MpxStickySection'
export default _StickySection
