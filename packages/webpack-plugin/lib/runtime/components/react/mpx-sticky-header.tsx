
import React, { useEffect, useRef, useState, useContext, forwardRef, cloneElement } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { ScrollViewContext } from './context'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useTransformStyle, useLayout, wrapChildren, extendObject, flatGesture, GestureHandler } from './utils'
interface StickyHeaderProps {
  children?: ReactNode;
  style?: ViewStyle;
  'enable-var'?: boolean;
  'external-var-context'?: Record<string, any>;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;

}

const _StickyHeader = forwardRef<HandlerRef<View, StickyHeaderProps>, StickyHeaderProps>((stickyHeaderProps: StickyHeaderProps = {}, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(stickyHeaderProps)
  const {
    style,
    children,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props
  const [contentHeight, setContentHeight] = useState(0)
  const [headerTop, setHeaderTop] = useState(0)
  const [isSticky, setIsSticky] = useState(false)
  const scrollViewContext = useContext(ScrollViewContext)
  const scrollOffset = scrollViewContext.scrollOffset
  const headerRef = useRef(null)

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: headerRef })

  const { textStyle, innerStyle = {} } = splitStyle(normalStyle)

  useNodesRef(props, ref, headerRef, {
    style: normalStyle
  })

  // 测量 header 位置
  useEffect(() => {
    if (headerRef.current) {
      headerRef.current.measure((x, y, width, height, pageX, pageY) => {
        setContentHeight(height)
        setHeaderTop(pageY)
      })
    }
  }, [])

  const animatedStyle = React.useMemo(() => {
    if (headerTop === null) {
      return {}
    } // 等待 headerTop 被测量

    // 设置阈值，处理精度问题
    const threshold = 1

    // 根据 headerTop 的值选择合适的 inputRange 和 outputRange
    const inputRange =
      headerTop <= threshold ? [0, 1] : [headerTop - 1, headerTop]

    const outputRange = [0, 1]

    // 计算 translateY
    const translateY = Animated.multiply(
      scrollOffset.interpolate({
        inputRange,
        outputRange,
        extrapolate: 'clamp'
      }),
      Animated.subtract(scrollOffset, headerTop <= threshold ? 0 : headerTop)
    )

    return {
      transform: [{ translateY }],
      zIndex: 100
    }
  }, [headerTop, scrollOffset])

  return (
    <Animated.View
      ref={headerRef}
      style={[
        styles.content,
        innerStyle,
        layoutStyle,
        animatedStyle
      ]}>
      {cloneElement(children, {
        style: styles.fill
      })}
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  content: {
    width: '100%',
    boxSizing: 'border-box',
    zIndex: 10
  },
  fill: {
    flex: 1
  }
})

_StickyHeader.displayName = 'MpxStickyHeader'
export default _StickyHeader
