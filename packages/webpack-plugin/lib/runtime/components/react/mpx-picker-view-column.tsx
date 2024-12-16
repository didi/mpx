import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native'
import React, { forwardRef, useRef, useState, useMemo, useEffect, cloneElement } from 'react'
import { useTransformStyle, splitStyle, splitProps, useLayout, usePrevious, extendObject, wrapChildren } from './utils'
import useNodesRef, { HandlerRef } from './useNodesRef'
import PickerOverlay from './pickerViewOverlay'
import PickerMask from './pickerViewMask'

interface ColumnProps {
  children?: React.ReactNode
  columnData: React.ReactNode[]
  columnStyle: Record<string, any>
  initialIndex: number
  getInnerLayout: Function
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

const _PickerViewColumn = forwardRef<HandlerRef<ScrollView & View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const {
    columnData,
    columnIndex,
    columnStyle,
    initialIndex,
    onSelectChange,
    getInnerLayout,
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
  const scrollViewRef = useRef<ScrollView>(null)

  useNodesRef(props, ref, scrollViewRef, {
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

  const initialOffset = useMemo(() => ({
    x: 0,
    y: itemRawH * initialIndex
  }), [itemRawH])

  const snapToOffsets = useMemo(
    () => columnData.map((_, i) => i * itemRawH),
    [maxIndex, itemRawH]
  )

  const paddingHeight = useMemo(
    () => Math.round(pickerH - itemRawH) / 2,
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

    activeIndex.current = initialIndex
    scrollViewRef.current.scrollTo({
      x: 0,
      y: itemRawH * initialIndex,
      animated: false
    })
  }, [itemRawH, initialIndex])

  const _onLayout = () => {
    getInnerLayout && getInnerLayout(layoutRef)
  }

  const {
    layoutRef,
    layoutProps
  } = useLayout({
    props,
    hasSelfPercent,
    setWidth,
    setHeight,
    nodeRef: scrollViewRef,
    onLayout: _onLayout
  })

  const onScrollViewLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout
    const widthInt = Math.round(width)
    if (width !== widthInt && widthInt !== scrollViewWidth) {
      setScrollViewWidth(widthInt)
    }
  }

  const onContentSizeChange = (_w: number, h: number) => {
    const y = itemRawH * initialIndex
    if (y <= h) {
      scrollViewRef.current?.scrollTo({ x: 0, y, animated: false })
    }
  }

  const onItemLayout = (e: LayoutChangeEvent) => {
    const { height: rawH } = e.nativeEvent.layout
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
      const restProps = index === 0 ? { onLayout: onItemLayout } : {}
      const itemProps = extendObject(
        {
          key: `picker-column-item-${index}`,
          style: extendObject(
            { height: itemHeight, width: '100%' },
            textStyleFromParent,
            textStyle,
            item.props.style
          )
        },
        restProps
      )
      const realItem = cloneElement(item, itemProps)
      return wrapChildren(
        { children: realItem },
        {
          hasVarDec,
          varContext: varContextRef.current,
          textStyle,
          textProps
        }
      )
    })

  const renderScollView = () => {
    return (
      <ScrollView
        ref={scrollViewRef}
        bounces={true}
        horizontal={false}
        pagingEnabled={false}
        nestedScrollEnabled={true}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        {...layoutProps}
        style={[{ width: scrollViewWidth }]}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentOffset={initialOffset}
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
      </ScrollView>
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
