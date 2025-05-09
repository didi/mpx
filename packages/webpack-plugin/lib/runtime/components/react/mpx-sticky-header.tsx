import { useEffect, useRef, useState, useContext, forwardRef, useMemo, createElement, ReactNode, useId } from 'react'
import { Animated, StyleSheet, View, NativeSyntheticEvent, ViewStyle, LayoutChangeEvent } from 'react-native'
import { ScrollViewContext, StickyContext } from './context'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useTransformStyle, wrapChildren, useLayout, extendObject } from './utils'
import { error } from '@mpxjs/utils'
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

  const scrollViewContext = useContext(ScrollViewContext)
  const stickyContext = useContext(StickyContext)
  const { scrollOffset } = scrollViewContext
  const { registerStickyHeader, unregisterStickyHeader } = stickyContext
  const headerRef = useRef<View>(null)
  const isStickOnTopRef = useRef(false)
  const id = useId()

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

  const headerTopAnimated = useRef(new Animated.Value(0)).current
  // harmony animatedValue 不支持通过 _value 访问
  const headerTopRef = useRef(0)

  useEffect(() => {
    registerStickyHeader({ key: id, updatePosition })
    return () => {
      unregisterStickyHeader(id)
    }
  }, [])

  function updatePosition () {
    if (headerRef.current) {
      const scrollViewRef = scrollViewContext.gestureRef
      if (scrollViewRef && scrollViewRef.current) {
        headerRef.current.measureLayout(
          scrollViewRef.current,
          (left: number, top: number) => {
            Animated.timing(headerTopAnimated, {
              toValue: top,
              duration: 0,
              useNativeDriver: true
            }).start()
            headerTopRef.current = top
          }
        )
      } else {
        error('StickyHeader measureLayout error: scrollViewRef is not a valid native component reference')
      }
    }
  }

  function onLayout (e: LayoutChangeEvent) {
    updatePosition()
  }

  useNodesRef(props, ref, headerRef, {
    style: normalStyle
  })

  useEffect(() => {
    if (!bindstickontopchange) return

    const listener = scrollOffset.addListener((state: { value: number }) => {
      const currentScrollValue = state.value
      const newIsStickOnTop = currentScrollValue > headerTopRef.current
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
  }, [])

  const animatedStyle = useMemo(() => {
    const translateY = Animated.subtract(scrollOffset, headerTopAnimated).interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolateLeft: 'clamp',
      extrapolateRight: 'extend'
    })

    const finalTranslateY = offsetTop === 0
      ? translateY
      : Animated.add(
        translateY,
        Animated.subtract(scrollOffset, headerTopAnimated).interpolate({
          inputRange: [0, 1],
          outputRange: [0, offsetTop],
          extrapolate: 'clamp'
        })
      )

    return {
      transform: [{ translateY: finalTranslateY }]
    }
  }, [scrollOffset, headerTopAnimated, offsetTop])

  const innerProps = useInnerProps(extendObject({}, props, {
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
