
import { useRef, forwardRef, createElement, ReactNode, useCallback, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useTransformStyle, wrapChildren, useLayout, extendObject } from './utils'
import { StickyContext } from './context'
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

  const { layoutRef, layoutProps, layoutStyle } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: sectionRef, onLayout })

  const { textStyle, innerStyle = {} } = splitStyle(normalStyle)

  const stickyHeaders = useRef<Map<string, any>>(new Map())

  const registerStickyHeader = useCallback((item: { id: string, updatePosition: Function }) => {
    stickyHeaders.current.set(item.id, item)
  }, [])

  const unregisterStickyHeader = useCallback((id: string) => {
    stickyHeaders.current.delete(id)
  }, [])

  const contextValue = useMemo(() => ({
    registerStickyHeader,
    unregisterStickyHeader
  }), [])

  useNodesRef(props, ref, sectionRef, {
    style: normalStyle
  })

  function onLayout () {
    stickyHeaders.current.forEach(item => {
      item.updatePosition()
    })
  }

  const innerProps = useInnerProps(props, extendObject({
    style: extendObject(innerStyle, layoutStyle),
    ref: sectionRef
  }, layoutProps), [], { layoutRef })

  return (
    createElement(
      View,
      innerProps,
      createElement(
        StickyContext.Provider,
        { value: contextValue },
        wrapChildren(
          props,
          {
            hasVarDec,
            varContext: varContextRef.current,
            textStyle,
            textProps
          }
        )
      ))
  )
})

_StickySection.displayName = 'MpxStickySection'
export default _StickySection
