
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, SafeAreaView, ScrollView, View } from 'react-native'
import React, { forwardRef, useRef, useState, useMemo, useEffect } from 'react'
import { useTransformStyle, splitStyle, splitProps, wrapChildren, useLayout, usePrevious } from './utils'
import useNodesRef, { HandlerRef } from './useNodesRef'
import PickerOverlay from './pickerViewOverlay'
import PickerMask from './pickerViewMask'

interface ColumnProps {
  children?: React.ReactNode
  columnData: React.ReactNode[]
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

const DefaultPickerItemH = 36

const _PickerViewColumn = forwardRef<HandlerRef<ScrollView & View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const {
    columnData,
    columnIndex,
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
  const { textStyle } = splitStyle(normalStyle)
  const { textProps } = splitProps(props)
  const scrollViewRef = useRef<ScrollView>(null)
  useNodesRef(props, ref, scrollViewRef, {})

  const { height: pickerH, itemHeight = DefaultPickerItemH } = wrapperStyle
  const [itemRawH, setItemRawH] = useState(0)
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
    [columnData, itemRawH]
  )

  const paddingHeight = useMemo(
    () => Math.round(pickerH - itemRawH) / 2,
    [pickerH, itemRawH]
  )

  const contentContainerStyle = useMemo(() => {
    return [{ paddingVertical: paddingHeight }]
  }, [paddingHeight])

  const onContentSizeChange = (_w: number, h: number) => {
    if (itemRawH * initialIndex > h) {
      return
    }
    scrollViewRef.current?.scrollTo({
      x: 0,
      y: itemRawH * initialIndex,
      animated: false
    })
  }

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

  const onScrollViewLayout = () => {
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
    onLayout: onScrollViewLayout
  })

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
    columnData.map((item: React.ReactNode, index: number) => {
      const InnerProps = index === 0 ? { onLayout: onItemLayout } : {}
      const strKey = `picker-column-${columnIndex}-${index}`
      return (
        <View
          key={strKey}
          {...InnerProps}
          style={[
            {
              height: itemHeight || DefaultPickerItemH,
              width: '100%'
            }
          ]}
        >
          {wrapChildren(
            { children: item },
            {
              hasVarDec,
              varContext: varContextRef.current,
              textStyle,
              textProps
            }
          )}
        </View>
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
        scrollEventThrottle={16}
        contentContainerStyle={contentContainerStyle}
        onContentSizeChange={onContentSizeChange}
        contentOffset={initialOffset}
        snapToOffsets={snapToOffsets}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
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
      height={paddingHeight}
      itemHeight={itemHeight}
      maskContainerStyle={pickerMaskStyle}
    />
  )

  return (
    <SafeAreaView style={[{ display: 'flex', flex: 1 }]}>
      {renderScollView()}
      {renderMask()}
      {renderOverlay()}
    </SafeAreaView>
  )
})

_PickerViewColumn.displayName = 'MpxPickerViewColumn'
export default _PickerViewColumn
