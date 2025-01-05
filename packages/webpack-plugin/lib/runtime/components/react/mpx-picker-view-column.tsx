import React, { forwardRef, useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native'
import Reanimated, { AnimatedRef, useAnimatedRef, useScrollViewOffset } from 'react-native-reanimated'
import { useTransformStyle, splitStyle, splitProps, useLayout, usePrevious, isAndroid, isIOS, useDebounceCallback, useStableCallback } from './utils'
import useNodesRef, { HandlerRef } from './useNodesRef'
import PickerIndicator from './pickerViewIndicator'
import PickerMask from './pickerViewMask'
import MpxPickerVIewColumnItem from './mpx-picker-view-column-item'
import { PickerViewColumnAnimationContext } from './pickerVIewContext'

interface ColumnProps {
  children?: React.ReactNode
  columnData: React.ReactNode[]
  initialIndex: number
  onSelectChange: Function
  style: {
    [key: string]: any
  }
  'enable-var': boolean
  'external-var-context'?: Record<string, any>
  wrapperStyle: {
    height: number
    itemHeight: number
  }
  pickerMaskStyle: Record<string, any>
  pickerIndicatorStyle: Record<string, any>
  columnIndex: number
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
  const { textProps } = splitProps(props)
  const scrollViewRef = useAnimatedRef<Reanimated.ScrollView>()
  const offsetYShared = useScrollViewOffset(scrollViewRef as AnimatedRef<Reanimated.ScrollView>)

  useNodesRef(props, ref, scrollViewRef as AnimatedRef<ScrollView>, {
    style: normalStyle
  })

  const { height: pickerH, itemHeight } = wrapperStyle
  const [itemRawH, setItemRawH] = useState(itemHeight)
  const maxIndex = useMemo(() => columnData.length - 1, [columnData])
  const prevScrollingInfo = useRef({ index: initialIndex, y: 0 })
  const touching = useRef(false)
  const scrolling = useRef(false)
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
    () => columnData.map((_, i) => i * itemRawH),
    [columnData, itemRawH]
  )

  const contentContainerStyle = useMemo(() => {
    return [{ paddingVertical: paddingHeight }]
  }, [paddingHeight])

  const getIndex = useCallback((y: number) => {
    const calc = Math.round(y / itemRawH)
    return Math.max(0, Math.min(calc, maxIndex))
  }, [itemRawH, maxIndex])

  const getYofIndex = useCallback((index: number) => {
    return index * itemRawH
  }, [itemRawH])

  const stableResetScrollPosition = useStableCallback((y: number) => {
    if (touching.current || scrolling.current) {
      return
    }
    // needReset.current = true
    if (y % itemRawH !== 0) {
      scrolling.current = true
      const targetIndex = getIndex(y)
      const targetY = getYofIndex(targetIndex)
      scrollViewRef.current?.scrollTo({ x: 0, y: targetY, animated: false })
    } else {
      onMomentumScrollEnd({ nativeEvent: { contentOffset: { y } } })
    }
  })
  const debounceResetScrollPosition = useDebounceCallback(stableResetScrollPosition, 10)

  useEffect(() => {
    if (
      !scrollViewRef.current ||
      !itemRawH ||
      touching.current ||
      scrolling.current ||
      prevIndex == null ||
      initialIndex === prevIndex ||
      initialIndex === activeIndex.current ||
      maxIndex !== prevMaxIndex
    ) {
      return
    }
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: 0,
        y: getYofIndex(initialIndex),
        animated: false
      })
    }, isAndroid ? 200 : 0)
    activeIndex.current = initialIndex
  }, [itemRawH, initialIndex])

  const onContentSizeChange = (_w: number, h: number) => {
    const y = getYofIndex(initialIndex)
    if (y <= h) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 0, y, animated: false })
      }, 0)
    }
  }

  const onItemLayout = (e: LayoutChangeEvent) => {
    const { height: rawH } = e.nativeEvent.layout
    const roundedH = Math.round(rawH)
    if (roundedH && roundedH !== itemRawH) {
      setItemRawH(roundedH)
    }
  }

  const onScrollBeginDrag = () => {
    isIOS && debounceResetScrollPosition.clear()
    touching.current = true
    prevScrollingInfo.current = {
      index: activeIndex.current,
      y: getYofIndex(activeIndex.current)
    }
  }

  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    touching.current = false
    const { y } = e.nativeEvent.contentOffset
    if (isIOS) {
      if (y >= 0 && y <= snapToOffsets[maxIndex]) {
        debounceResetScrollPosition(y)
      }
    }
  }

  const onMomentumScrollBegin = () => {
    isIOS && debounceResetScrollPosition.clear()
    scrolling.current = true
  }

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent> | { nativeEvent: { contentOffset: { y: number } } }) => {
    scrolling.current = false
    const { y: scrollY } = e.nativeEvent.contentOffset
    if (isIOS && scrollY % itemRawH !== 0) {
      return debounceResetScrollPosition(scrollY)
    }
    const calcIndex = getIndex(scrollY)
    if (calcIndex !== activeIndex.current) {
      activeIndex.current = calcIndex
      onSelectChange(calcIndex)
    }
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // 全局注册的振动触感 hook
    const pickerVibrate = global.__mpx?.config?.rnConfig?.pickerVibrate
    if (typeof pickerVibrate !== 'function') {
      return
    }
    const { y } = e.nativeEvent.contentOffset
    const { index: prevIndex, y: _y } = prevScrollingInfo.current
    if (touching.current || scrolling.current) {
      if (Math.abs(y - _y) >= itemRawH) {
        const currentId = getIndex(y)
        if (currentId !== prevIndex) {
          prevScrollingInfo.current = {
            index: currentId,
            y: getYofIndex(currentId)
          }
          // vibrateShort({ type: 'selection' })
          pickerVibrate()
        }
      }
    }
  }

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
    return (
      <PickerViewColumnAnimationContext.Provider value={offsetYShared}>
        <Reanimated.ScrollView
          ref={scrollViewRef}
          bounces={true}
          horizontal={false}
          nestedScrollEnabled={true}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          {...layoutProps}
          style={[{ width: '100%' }]}
          decelerationRate="fast"
          snapToOffsets={snapToOffsets}
          onScroll={onScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          onMomentumScrollBegin={onMomentumScrollBegin}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onContentSizeChange={onContentSizeChange}
          contentContainerStyle={contentContainerStyle}
        >
          {renderInnerchild()}
        </Reanimated.ScrollView>
      </PickerViewColumnAnimationContext.Provider>
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
  wrapper: { display: 'flex', flex: 1 }
})

_PickerViewColumn.displayName = 'MpxPickerViewColumn'
export default _PickerViewColumn
