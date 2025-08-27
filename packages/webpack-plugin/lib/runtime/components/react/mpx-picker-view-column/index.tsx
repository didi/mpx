import React, { forwardRef, useRef, useState, useMemo, useEffect, useCallback, createElement } from 'react'
import { GestureResponderEvent, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native'
import Reanimated, { AnimatedRef, useAnimatedRef, useScrollViewOffset } from 'react-native-reanimated'
import { useTransformStyle, splitStyle, splitProps, useLayout, usePrevious, isAndroid, isIOS, isHarmony, extendObject } from '../utils'
import useNodesRef, { HandlerRef } from '../useNodesRef'
import PickerIndicator from './pickerViewIndicator'
import PickerMask from './pickerViewMask'
import MpxPickerVIewColumnItem from './pickerViewColumnItem'
import { PickerViewColumnAnimationContext } from '../mpx-picker-view/pickerVIewContext'
import { calcHeightOffsets } from './pickerViewFaces'

interface ColumnProps {
  columnIndex: number
  columnData: React.ReactNode[]
  initialIndex: number
  onSelectChange: Function
  style: {
    [key: string]: any
  }
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  wrapperStyle: {
    height: number
    itemHeight: number
  }
  pickerMaskStyle: Record<string, any>
  pickerIndicatorStyle: Record<string, any>
}

const visibleCount = 5

const _PickerViewColumn = forwardRef<HandlerRef<ScrollView & View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const {
    columnData,
    columnIndex,
    initialIndex,
    onSelectChange,
    style,
    wrapperStyle,
    pickerMaskStyle,
    pickerIndicatorStyle,
    'enable-var': enableVar,
    'external-var-context': externalVarContext
  } = props

  const {
    normalStyle,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext })
  const { textStyle = {} } = splitStyle(normalStyle)
  const { textProps = {} } = splitProps(props)
  const scrollViewRef = useAnimatedRef<Reanimated.ScrollView>()
  const offsetYShared = useScrollViewOffset(scrollViewRef as AnimatedRef<Reanimated.ScrollView>)

  useNodesRef(props, ref, scrollViewRef as AnimatedRef<ScrollView>, {
    style: normalStyle
  })

  const { height: pickerH, itemHeight } = wrapperStyle
  const [itemRawH, setItemRawH] = useState(itemHeight)
  const maxIndex = useMemo(() => columnData.length - 1, [columnData])
  const prevScrollingInfo = useRef({ index: initialIndex, y: 0 })
  const dragging = useRef(false)
  const scrolling = useRef(false)
  const timerResetPosition = useRef<NodeJS.Timeout | null>(null)
  const timerScrollTo = useRef<NodeJS.Timeout | null>(null)
  const timerClickOnce = useRef<NodeJS.Timeout | null>(null)
  const activeIndex = useRef(initialIndex)
  const prevIndex = usePrevious(initialIndex)
  const prevMaxIndex = usePrevious(maxIndex)

  const {
    layoutProps
  } = useLayout({
    props,
    hasSelfPercent,
    setWidth,
    setHeight,
    nodeRef: scrollViewRef
  })

  const paddingHeight = useMemo(
    () => Math.round((pickerH - itemHeight) / 2),
    [pickerH, itemHeight]
  )

  const snapToOffsets = useMemo(
    () => Array.from({ length: maxIndex + 1 }, (_, i) => i * itemRawH),
    [maxIndex, itemRawH]
  )

  const contentContainerStyle = useMemo(() => {
    return [{ paddingVertical: paddingHeight }]
  }, [paddingHeight])

  const getIndex = useCallback((y: number) => {
    const calc = Math.round(y / itemRawH)
    return Math.max(0, Math.min(calc, maxIndex))
  }, [itemRawH, maxIndex])

  const clearTimerResetPosition = useCallback(() => {
    if (timerResetPosition.current) {
      clearTimeout(timerResetPosition.current)
      timerResetPosition.current = null
    }
  }, [])

  const clearTimerScrollTo = useCallback(() => {
    if (timerScrollTo.current) {
      clearTimeout(timerScrollTo.current)
      timerScrollTo.current = null
    }
  }, [])

  const clearTimerClickOnce = useCallback(() => {
    if (timerClickOnce.current) {
      clearTimeout(timerClickOnce.current)
      timerClickOnce.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearTimerResetPosition()
      clearTimerScrollTo()
    }
  }, [])

  useEffect(() => {
    if (
      !scrollViewRef.current ||
      !itemRawH ||
      dragging.current ||
      scrolling.current ||
      prevIndex == null ||
      initialIndex === prevIndex ||
      initialIndex === activeIndex.current ||
      maxIndex !== prevMaxIndex
    ) {
      return
    }
    clearTimerScrollTo()
    timerScrollTo.current = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: 0,
        y: initialIndex * itemRawH,
        animated: false
      })
      activeIndex.current = initialIndex
    }, isIOS ? 0 : 200)
  }, [itemRawH, maxIndex, initialIndex])

  const onContentSizeChange = useCallback((_w: number, h: number) => {
    const y = initialIndex * itemRawH
    if (y <= h) {
      clearTimerScrollTo()
      timerScrollTo.current = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 0, y, animated: false })
        activeIndex.current = initialIndex
      }, 0)
    }
  }, [itemRawH, initialIndex])

  const onItemLayout = useCallback((e: LayoutChangeEvent) => {
    const { height: rawH } = e.nativeEvent.layout
    const roundedH = Math.round(rawH)
    if (roundedH && roundedH !== itemRawH) {
      setItemRawH(roundedH)
    }
  }, [itemRawH])

  const resetScrollPosition = useCallback((y: number) => {
    if (dragging.current || scrolling.current) {
      return
    }
    scrolling.current = true
    const targetIndex = getIndex(y)
    scrollViewRef.current?.scrollTo({ x: 0, y: targetIndex * itemRawH, animated: false })
  }, [itemRawH, getIndex])

  const onMomentumScrollBegin = useCallback(() => {
    isIOS && clearTimerResetPosition()
    scrolling.current = true
  }, [])

  const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent> | { nativeEvent: { contentOffset: { y: number } } }) => {
    scrolling.current = false
    const { y: scrollY } = e.nativeEvent.contentOffset
    if (isIOS && scrollY % itemRawH !== 0) {
      return resetScrollPosition(scrollY)
    }
    const calcIndex = getIndex(scrollY)
    if (calcIndex !== activeIndex.current) {
      activeIndex.current = calcIndex
      onSelectChange(calcIndex)
    }
  }, [itemRawH, getIndex, onSelectChange, resetScrollPosition])

  const onScrollBeginDrag = useCallback(() => {
    isIOS && clearTimerResetPosition()
    dragging.current = true
    prevScrollingInfo.current = {
      index: activeIndex.current,
      y: activeIndex.current * itemRawH
    }
  }, [itemRawH])

  const onScrollEndDrag = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragging.current = false
    if (!isAndroid) {
      const { y } = e.nativeEvent.contentOffset
      if (y % itemRawH === 0 || (isHarmony && y > snapToOffsets[maxIndex])) {
        onMomentumScrollEnd({ nativeEvent: { contentOffset: { y } } })
      } else if (y > 0 && y < snapToOffsets[maxIndex]) {
        timerResetPosition.current = setTimeout(() => {
          resetScrollPosition(y)
        }, 10)
      }
    }
  }, [itemRawH, maxIndex, snapToOffsets, onMomentumScrollEnd, resetScrollPosition])

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // 全局注册的振动触感 hook
    const onPickerVibrate = global.__mpx?.config?.rnConfig?.onPickerVibrate
    if (typeof onPickerVibrate !== 'function') {
      return
    }
    const { y } = e.nativeEvent.contentOffset
    const { index: prevIndex, y: _y } = prevScrollingInfo.current
    if (dragging.current || scrolling.current) {
      if (Math.abs(y - _y) >= itemRawH) {
        const currentId = getIndex(y)
        if (currentId !== prevIndex) {
          prevScrollingInfo.current = {
            index: currentId,
            y: currentId * itemRawH
          }
          // vibrateShort({ type: 'selection' })
          onPickerVibrate()
        }
      }
    }
  }, [itemRawH, getIndex])

  const offsetHeights = useMemo(() => calcHeightOffsets(itemRawH), [itemRawH])

  const calcOffset = useCallback((y: number): number | false => {
    const baselineY = activeIndex.current * itemRawH + pickerH / 2
    const diff = Math.abs(y - baselineY)
    const positive = y - baselineY > 0 ? 1 : -1
    const [h1, h2, h3] = offsetHeights
    if (diff > h1 && diff < h3) {
      if (diff < h2) {
        return 1 * positive
      } else {
        return 2 * positive
      }
    }
    return false
  }, [offsetHeights])

  /**
   * 和小程序表现对齐，点击（不滑动）非焦点选项自动滚动到对应位置
   */
  const onClickOnceItem = useCallback((e: GestureResponderEvent) => {
    const { locationY } = e.nativeEvent || {}
    const offsetIndex = calcOffset(locationY)
    if (dragging.current || !offsetIndex) {
      return
    }
    const targetIndex = activeIndex.current + offsetIndex
    if (targetIndex < 0 || targetIndex > maxIndex) {
      return
    }
    const y = targetIndex * itemRawH
    scrollViewRef.current?.scrollTo({ x: 0, y, animated: true })
    if (isAndroid) {
      // Android scrollTo 不会自动触发 onMomentumScrollEnd，需要手动触发
      clearTimerClickOnce()
      timerClickOnce.current = setTimeout(() => {
        onMomentumScrollEnd({ nativeEvent: { contentOffset: { y } } })
      }, 250)
    }
  }, [itemRawH, maxIndex, calcOffset, onMomentumScrollEnd])

  const renderInnerchild = () =>
    columnData.map((item: React.ReactElement, index: number) => {
      return (
        <MpxPickerVIewColumnItem
          key={index}
          item={item}
          index={index}
          itemHeight={itemHeight}
          textStyle={textStyle}
          textProps={textProps}
          visibleCount={visibleCount}
          onItemLayout={onItemLayout}
        />
      )
    })

  const renderScollView = () => {
    const innerProps = extendObject({}, layoutProps, {
      ref: scrollViewRef,
      bounces: true,
      horizontal: false,
      nestedScrollEnabled: true,
      removeClippedSubviews: false,
      showsVerticalScrollIndicator: false,
      showsHorizontalScrollIndicator: false,
      scrollEventThrottle: 16,
      style: styles.scrollView,
      decelerationRate: 'fast',
      snapToOffsets: snapToOffsets,
      onTouchEnd: onClickOnceItem,
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
      onMomentumScrollBegin,
      onMomentumScrollEnd,
      onContentSizeChange,
      contentContainerStyle
    }) as React.ComponentProps<typeof Reanimated.ScrollView>

    return createElement(
      PickerViewColumnAnimationContext.Provider,
      { value: offsetYShared },
      createElement(
        Reanimated.ScrollView,
        innerProps,
        renderInnerchild()
      )
    )
  }

  const renderIndicator = () => (
    <PickerIndicator
      itemHeight={itemHeight}
      indicatorItemStyle={pickerIndicatorStyle}
    />
  )

  const renderMask = () => (
    <PickerMask
      itemHeight={itemHeight}
      maskContainerStyle={pickerMaskStyle}
    />
  )

  return (
    <View style={[styles.wrapper, normalStyle]}>
        {renderScollView()}
        {renderMask()}
        {renderIndicator()}
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: { display: 'flex', flex: 1 },
  scrollView: { width: '100%' }
})

_PickerViewColumn.displayName = 'MpxPickerViewColumn'
export default _PickerViewColumn
