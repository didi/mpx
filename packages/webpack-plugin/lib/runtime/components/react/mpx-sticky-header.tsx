
import { useEffect, useRef, useState, useContext, forwardRef, useMemo, createElement, ReactNode } from 'react'
import { StyleSheet, View, NativeSyntheticEvent, ViewStyle, LayoutChangeEvent } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, interpolate, Extrapolate } from 'react-native-reanimated'
import { ScrollViewContext } from './context'
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
  const { scrollOffset } = scrollViewContext
  const headerRef = useRef<View>(null)
  const isStickOnTopRef = useRef(false)
  const reanimatedScrollOffset = useSharedValue(0)
  const headerTop = useSharedValue(0)

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

  const hasLayoutRef = useRef(false)

  function onLayout (e: LayoutChangeEvent) {
    if (headerRef.current) {
      // 只测量一次，避免内容变化导致位置变化
      if (!hasLayoutRef.current) {
        hasLayoutRef.current = true
        const scrollViewRef = scrollViewContext.gestureRef
        if (scrollViewRef && scrollViewRef.current) {
          // 使用 measureLayout 测量相对于 ScrollView 的位置
          headerRef.current.measureLayout(
            scrollViewRef.current,
            (left: number, top: number) => {
              headerTop.value = top - offsetTop
            }
          )
        } else {
          error('StickyHeader measureLayout error: scrollViewRef is not a valid native component reference')
        }
      }
    }
  }

  useNodesRef(props, ref, headerRef, {
    style: normalStyle
  })

  useEffect(() => {
    if (!bindstickontopchange) return

    const listener = scrollOffset.addListener((state: { value: number }) => {
      const currentScrollValue = state.value
      reanimatedScrollOffset.value = state.value
      const newIsStickOnTop = currentScrollValue > headerTop.value
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

  // 创建动画样式
  const animatedStyle = useAnimatedStyle(() => {
    // 计算 translateY
    const translateY = interpolate(reanimatedScrollOffset.value, [0, headerTop.value, headerTop.value + 1], [0, 0, 1], Extrapolate.CLAMP) * (reanimatedScrollOffset.value - headerTop.value)
    return {
      transform: [{ translateY }]
    }
  })

  const innerProps = useInnerProps(props, extendObject({}, {
    ref: headerRef,
    style: [styles.content, innerStyle, animatedStyle, {
      paddingTop: padding[0] || 0,
      paddingRight: padding[1] || 0,
      paddingBottom: padding[2] || 0,
      paddingLeft: padding[3] || 0
    }]
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
