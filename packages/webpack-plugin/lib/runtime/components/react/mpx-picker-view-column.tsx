import React, { forwardRef, useRef, useState, useMemo, useEffect } from 'react'
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native'
import Reanimated, { AnimatedRef, scrollTo, useAnimatedRef, useAnimatedScrollHandler, useDerivedValue, useScrollViewOffset, useSharedValue } from 'react-native-reanimated'
import { useTransformStyle, splitStyle, splitProps, useLayout, usePrevious } from './utils'
import useNodesRef, { HandlerRef } from './useNodesRef'
import PickerOverlay from './pickerViewOverlay'
import PickerMask from './pickerViewMask'
import MpxPickerVIewColumnItem from './mpx-picker-view-column-item'
import { PickerViewColumnAnimationContext } from './pickerVIewContext'

interface ColumnProps {
  children?: React.ReactNode
  columnData: React.ReactNode[]
  columnStyle: Record<string, any>
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
  pickerOverlayStyle: Record<string, any>
  columnIndex: number
}

const visibleCount = 5

const _PickerViewColumn = forwardRef<HandlerRef<ScrollView & View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const {
    columnData,
    columnIndex,
    columnStyle,
    initialIndex,
    onSelectChange,
    style,
    wrapperStyle,
    pickerMaskStyle,
    pickerOverlayStyle,
    'enable-var': enableVar,
    'external-var-context': externalVarContext
  } = props

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext })
  const { textStyle: textStyleFromParent = {} } = splitStyle(columnStyle)
  const { textStyle = {} } = splitStyle(normalStyle)
  const { textProps } = splitProps(props)
  // const scrollViewRef = useRef<ScrollView>(null)
  const scrollViewRef = useAnimatedRef<Reanimated.ScrollView>()
  const offsetYShared = useScrollViewOffset(scrollViewRef as AnimatedRef<Reanimated.ScrollView>)

  useNodesRef(props, ref, scrollViewRef as AnimatedRef<ScrollView>, {
    style: normalStyle
  })

  const { height: pickerH, itemHeight } = wrapperStyle
  const [scrollViewWidth, setScrollViewWidth] = useState<number | '100%'>('100%')
  const [itemRawH, setItemRawH] = useState(itemHeight)
  const maxIndex = useMemo(() => columnData.length - 1, [columnData])
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

  // console.log('[mpx-picker-view-column], render ---> columnIndex=', columnIndex, 'initialIndex=', initialIndex, 'columnData=', columnData.length)

  // const initialOffset = useMemo(() => ({
  //   x: 0,
  //   y: itemRawH * initialIndex
  // }), [itemRawH])

  const snapToOffsets = useMemo(
    () => columnData.map((_, i) => i * itemRawH),
    [columnData, itemRawH]
  )

  const paddingHeight = useMemo(
    () => Math.round((pickerH - itemRawH) / 2),
    [pickerH, itemRawH]
  )

  const contentContainerStyle = useMemo(() => {
    return [{ paddingVertical: paddingHeight }]
  }, [paddingHeight])

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
    // console.log('[mpx-picker-view-column], useEffect ---> columnIndex=', columnIndex, 'initialIndex=', initialIndex, 'y=', itemRawH * initialIndex, scrollViewRef.current?.scrollTo, JSON.stringify(scrollViewRef.current?.scrollTo), `${scrollViewRef.current?.scrollTo}`)
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: 0,
        y: itemRawH * initialIndex,
        animated: false
      })
    }, 0)
    activeIndex.current = initialIndex
  }, [itemRawH, initialIndex])

  const onScrollViewLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout
    const widthInt = Math.round(width)
    // console.log('[mpx-picker-view-column], onScrollViewLayout --->', 'columnIndex=', columnIndex, 'width=', width, 'widthInt=', widthInt, 'scrollViewWidth=', scrollViewWidth)
    if (width !== widthInt && widthInt !== scrollViewWidth) {
      setScrollViewWidth(widthInt)
    }
  }

  const onContentSizeChange = (_w: number, h: number) => {
    const y = itemRawH * initialIndex
    // console.log('[mpx-picker-view-column], onContentSizeChange --->', 'columnIndex=', columnIndex, '_w=', _w, 'h=', h, 'y=', y)
    if (y <= h) {
      scrollViewRef.current?.scrollTo({ x: 0, y, animated: false })
    }
  }

  const onItemLayout = (e: LayoutChangeEvent) => {
    const { height: rawH } = e.nativeEvent.layout
    // console.log('[mpx-picker-view-column], onItemLayout --->', 'columnIndex=', columnIndex, 'rawH=', rawH, 'itemRawH=', itemRawH)
    if (rawH && itemRawH !== rawH) {
      setItemRawH(rawH)
    }
  }

  const onTouchStart = () => {
    touching.current = true
  }

  const onTouchEnd = () => {
    touching.current = false
  }

  const onTouchCancel = () => {
    touching.current = false
  }

  const onMomentumScrollBegin = () => {
    scrolling.current = true
  }

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrolling.current = false
    if (!itemRawH) {
      return
    }
    const { y: scrollY } = e.nativeEvent.contentOffset
    let calcIndex = Math.round(scrollY / itemRawH)
    activeIndex.current = calcIndex
    if (calcIndex !== initialIndex) {
      calcIndex = Math.max(0, Math.min(calcIndex, maxIndex)) || 0
      onSelectChange(calcIndex)
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
          textStyleFromParent={textStyleFromParent}
          textStyle={textStyle}
          hasVarDec={hasVarDec}
          varContext={varContextRef.current}
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
          nestedScrollEnabled={true}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          {...layoutProps}
          style={[{ width: scrollViewWidth }]}
          decelerationRate="fast"
          snapToOffsets={snapToOffsets}
          onLayout={onScrollViewLayout}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
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

  const renderOverlay = () => (
    <PickerOverlay
      itemHeight={itemHeight}
      overlayItemStyle={pickerOverlayStyle}
    />
  )

  const renderMask = () => (
    <PickerMask
      itemHeight={itemHeight}
      maskContainerStyle={pickerMaskStyle}
    />
  )

  return (
    <SafeAreaView style={[styles.wrapper, normalStyle]}>
      {renderScollView()}
      {renderMask()}
      {renderOverlay()}
    </SafeAreaView>
  )
})

const styles = StyleSheet.create({
  wrapper: { display: 'flex', flex: 1 }
})

_PickerViewColumn.displayName = 'MpxPickerViewColumn'
export default _PickerViewColumn
