
import { useEffect, useRef, useState, useContext, forwardRef, useMemo, createElement, ReactNode } from 'react'
import { Animated, StyleSheet, View, NativeSyntheticEvent, ViewStyle, LayoutChangeEvent, Platform } from 'react-native'
import { ScrollViewContext } from './context'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useTransformStyle, wrapChildren, useLayout, extendObject } from './utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'

interface StickyHeaderProps {
  children?: ReactNode;
  style?: ViewStyle;
  padding?: [number, number, number, number];
  'offset-top'?: number;
  'enable-var'?: boolean;
  'external-var-context'?: Record<string, any>;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  bindstickontopchange?: (e: NativeSyntheticEvent<unknown>) => void;
}
const isIOS = Platform.OS === 'ios'

const _StickyHeader = forwardRef<HandlerRef<View, StickyHeaderProps>, StickyHeaderProps>((stickyHeaderProps: StickyHeaderProps = {}, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(stickyHeaderProps)
  const {
    style,
    bindstickontopchange,
    padding = [0, 0, 0, 0],
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
  const { scrollOffset, scrollLayoutRef } = scrollViewContext
  const headerRef = useRef<View>(null)
  const isStickOnTopRef = useRef(false)

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { layoutRef, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: headerRef, onLayout })

  const { textStyle, innerStyle = {} } = splitStyle(normalStyle)

  function onLayout (e: LayoutChangeEvent) {
    if (headerRef.current) {
      // hack 外层做动画 android pageY 可能拿到不准问题
      setTimeout(() => {
        headerRef.current!.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          contentHeight.current = height
          setHeaderTop(pageY - offsetTop)
        })
      }, isIOS ? 0 : 100)
    }
  }

  useNodesRef(props, ref, headerRef, {
    style: normalStyle
  })

  useEffect(() => {
    if (!bindstickontopchange) return

    const listener = scrollOffset.addListener((state: { value: number }) => {
      const currentScrollValue = state.value
      const newIsStickOnTop = currentScrollValue > (headerTop - (scrollLayoutRef.current._offsetTop || 0))
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
    const realHeaderTop = headerTop - (scrollLayoutRef.current._offsetTop || 0)

    const inputRange =
     realHeaderTop <= threshold ? [0, 1] : [realHeaderTop - 1, realHeaderTop]

    const outputRange = [0, 1]

    const translateY = Animated.multiply(
      scrollOffset.interpolate({
        inputRange,
        outputRange,
        extrapolate: 'clamp'
      }),
      Animated.subtract(scrollOffset, realHeaderTop <= threshold ? -offsetTop : realHeaderTop)
    )

    return {
      transform: [{ translateY }]
    }
  }, [headerTop, scrollOffset])

  const innerProps = useInnerProps(props, extendObject({}, {
    ref: headerRef,
    style: extendObject({}, styles.content, innerStyle, animatedStyle, {
      paddingTop: padding[0] || 0,
      paddingRight: padding[1] || 0,
      paddingBottom: padding[2] || 0,
      paddingLeft: padding[3] || 0
    })
  }, layoutProps), [], { layoutRef })

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
    zIndex: 10
  }
})

_StickyHeader.displayName = 'MpxStickyHeader'
export default _StickyHeader
