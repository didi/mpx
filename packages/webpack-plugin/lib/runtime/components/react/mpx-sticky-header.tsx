
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

  const hasLayoutRef = useRef(false)

  function onLayout (e: LayoutChangeEvent) {
    if (headerRef.current) {
      // 外层可能有做动画的情况
      // 不加 setTimeout，安卓 pageY 获取的不准；ios pageY 如果有 refresherHeight 则从 refresherHeight 开始，否则从 0 开始, 均不包含 navigationHeight 的值
      // 加了 setTimeout 后， 安卓 pageY 为 navigationHeight + refresherHeight； iOS pageY 为 navigationHeight, 不包含 refresherHeight 的值
      setTimeout(() => {
        // sticky-header 里面的内容动态变更可能会触发 onLayout ，设置开关只以第一次位置为准
        if (!hasLayoutRef.current) {
          hasLayoutRef.current = true
          headerRef.current!.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            setHeaderTop(pageY - offsetTop)
          })
        }
      }, 100)
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
