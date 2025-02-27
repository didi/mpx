
import React, { useEffect, useRef, useState, useContext, forwardRef, useMemo, createElement } from 'react'
import { Animated, StyleSheet, View, NativeSyntheticEvent } from 'react-native'
import { ScrollViewContext } from './context'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useTransformStyle, wrapChildren, useLayout, extendObject } from './utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'

interface StickyHeaderProps {
  children?: ReactNode;
  style?: ViewStyle;
  'offset-top'?: number;
  'enable-var'?: boolean;
  'external-var-context'?: Record<string, any>;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  bindstickontopchange?: (e: NativeSyntheticEvent<unknown>) => void;
}

const _StickyHeader = forwardRef<HandlerRef<View, StickyHeaderProps>, StickyHeaderProps>((stickyHeaderProps: StickyHeaderProps = {}, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(stickyHeaderProps)
  const {
    style,
    bindstickontopchange,
    'offset-top': offsetTop = 0,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props
  const contentHeight = useRef(0)
  const [headerTop, setHeaderTop] = useState(0)
  const scrollViewContext = useContext(ScrollViewContext)
  const scrollOffset = scrollViewContext.scrollOffset
  const headerRef = useRef(null)
  const isStickOnTopRef = useRef(false)

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { layoutRef } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: headerRef })

  const { textStyle, innerStyle = {} } = splitStyle(normalStyle)

  useNodesRef(props, ref, headerRef, {
    style: normalStyle
  })

  useEffect(() => {
    if (headerRef.current) {
      headerRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        contentHeight.current = height
        setHeaderTop(pageY - offsetTop)
      })
    }
  }, [])

  useEffect(() => {
    if (!bindstickontopchange) return

    const listener = scrollOffset.addListener((state: { value: number }) => {
      const currentScrollValue = state.value
      const newIsStickOnTop = currentScrollValue > headerTop
      if (newIsStickOnTop !== isStickOnTopRef.current) {
        isStickOnTopRef.current = newIsStickOnTop
        bindstickontopchange(
          getCustomEvent('stickontopchange', {}, {
            detail: {
              isStickOnTop: newIsStickOnTop
            },
            layoutRef
          }, props))
      }
    })

    return () => {
      scrollOffset.removeListener(listener)
    }
  }, [headerTop])

  const animatedStyle = useMemo(() => {
    const threshold = 1

    const inputRange =
      headerTop <= threshold ? [0, 1] : [headerTop - 1, headerTop]

    const outputRange = [0, 1]

    const translateY = Animated.multiply(
      scrollOffset.interpolate({
        inputRange,
        outputRange,
        extrapolate: 'clamp'
      }),
      Animated.subtract(scrollOffset, headerTop <= threshold ? -offsetTop : headerTop)
    )

    return {
      transform: [{ translateY }]
    }
  }, [headerTop, scrollOffset])

  const innerProps = useInnerProps(props, {
    ref: headerRef,
    style: extendObject({}, styles.content, innerStyle, animatedStyle)
  }, [], { layoutRef })

  return (
    createElement(
      Animated.View,
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

const styles = StyleSheet.create({
  content: {
    width: '100%',
    boxSizing: 'border-box',
    zIndex: 10
  }
})

_StickyHeader.displayName = 'MpxStickyHeader'
export default _StickyHeader
