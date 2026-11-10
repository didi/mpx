import { useEffect, useRef, useState, useContext, forwardRef, useMemo, createElement, ReactNode, useId } from 'react'
import { Animated, StyleSheet, View, NativeSyntheticEvent, ViewStyle, LayoutChangeEvent, useAnimatedValue } from 'react-native'
import { ScrollViewContext, StickyContext } from './context'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useTransformStyle, wrapChildren, useLayout, extendObject, useTextPassThrough, useStableCallback } from './utils'
import { error } from '@mpxjs/utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'

interface StickyHeaderProps {
  children?: ReactNode;
  style?: ViewStyle;
  padding?: [number, number, number, number];
  'offset-top'?: number;
  'enable-var'?: boolean;
  'enable-text-pass-through'?: boolean;
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
    'enable-text-pass-through': enableTextPassThrough,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  const { scrollOffset, gestureRef: scrollViewRef } = useContext(ScrollViewContext)
  const stickyContext = useContext(StickyContext)
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
  } = useTransformStyle(style, { enableVar, parentWidth, parentHeight })

  const { layoutRef, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: headerRef, onLayout })

  const { textStyle, innerStyle = {} } = splitStyle(normalStyle)
  const textPassThrough = useTextPassThrough(textStyle, textProps, { enableTextPassThrough })

  const headerTopAnimated = useAnimatedValue(0)
  const [hasMeasured, setHasMeasured] = useState(false)
  // harmony animatedValue 不支持通过 _value 访问
  const headerTopRef = useRef<number | null>(null)
  const scrollOffsetRef = useRef(0)

  useEffect(() => {
    registerStickyHeader({ key: id, updatePosition })
    return () => {
      unregisterStickyHeader(id)
    }
  }, [])

  function updatePosition () {
    if (headerRef.current) {
      if (scrollViewRef && scrollViewRef.current) {
        headerRef.current.measureLayout(
          scrollViewRef.current,
          (left: number, top: number) => {
            if (headerTopRef.current === null) {
              headerTopAnimated.setValue(top)
              setHasMeasured(true)
            } else {
              Animated.timing(headerTopAnimated, {
                toValue: top,
                duration: 0,
                useNativeDriver: true
              }).start()
            }
            headerTopRef.current = top
            updateStickOnTop(scrollOffsetRef.current)
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

  const updateStickOnTop = useStableCallback((currentScrollValue: number) => {
    if (!bindstickontopchange || headerTopRef.current === null) return

    const newIsStickOnTop = currentScrollValue > headerTopRef.current - offsetTop
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

  useEffect(() => {
    if (!bindstickontopchange || !scrollOffset) return

    const listener = scrollOffset.addListener((state: { value: number }) => {
      scrollOffsetRef.current = state.value
      updateStickOnTop(state.value)
    })
    updateStickOnTop(scrollOffsetRef.current)

    return () => {
      scrollOffset.removeListener(listener)
    }
  }, [bindstickontopchange, scrollOffset, offsetTop, updateStickOnTop])

  const animatedStyle = useMemo(() => {
    if (scrollOffset && hasMeasured) {
      const translateY = Animated.subtract(scrollOffset, headerTopAnimated).interpolate({
        inputRange: [-offsetTop, 1 - offsetTop],
        outputRange: [0, 1],
        extrapolateLeft: 'clamp',
        extrapolateRight: 'extend'
      })

      return {
        transform: [{ translateY }]
      }
    }
  }, [scrollOffset, headerTopAnimated, offsetTop, hasMeasured])

  const innerProps = useInnerProps(extendObject({}, props, {
    ref: headerRef,
    style: extendObject({}, styles.content, innerStyle, animatedStyle, {
      paddingTop: padding[0] || 0,
      paddingRight: padding[1] || 0,
      paddingBottom: padding[2] || 0,
      paddingLeft: padding[3] || 0
    })
  }, layoutProps), [
    'padding',
    'offset-top',
    'bindstickontopchange'
  ], { layoutRef })

  return (
    createElement(
      Animated.View,
      innerProps,
      wrapChildren(
        props.children,
        {
          hasVarDec,
          varContext: varContextRef.current,
          textPassThrough
        }
      )
    )
  )
})

const styles = StyleSheet.create({
  content: {
    width: '100%',
    zIndex: 10,
    // harmony 需要手动设置 relative， zIndex 才生效
    position: 'relative'
  }
})

_StickyHeader.displayName = 'MpxStickyHeader'
export default _StickyHeader
