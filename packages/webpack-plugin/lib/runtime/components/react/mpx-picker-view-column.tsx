
import { View, Animated, SafeAreaView, NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent, ScrollView } from 'react-native'
import React, { forwardRef, useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { useTransformStyle, splitStyle, splitProps, wrapChildren, useLayout, usePrevious } from './utils'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { createFaces } from './pickerFaces'
import PickerOverlay from './pickerOverlay'

interface ColumnProps {
  children?: React.ReactNode
  columnData: React.ReactNode[]
  initialIndex: number
  onColumnItemRawHChange: Function
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
  pickerOverlayStyle: Record<string, any>
  columnIndex: number
}

// 默认的单个选项高度
const DefaultPickerItemH = 36
// 默认一屏可见选项个数
const visibleCount = 5

const _PickerViewColumn = forwardRef<HandlerRef<ScrollView & View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const {
    columnData,
    columnIndex,
    initialIndex,
    onSelectChange,
    onColumnItemRawHChange,
    getInnerLayout,
    style,
    wrapperStyle,
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
  const [itemRawH, setItemRawH] = useState(0) // 单个选项真实渲染高度
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

  const contentContainerStyle = useMemo(() => {
    return [
      {
        paddingVertical: Math.round(pickerH - itemRawH) / 2
      }
    ]
  }, [pickerH, itemRawH])

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

  const onContentSizeChange = (w: number, h: number) => {
    scrollViewRef.current?.scrollTo({
      x: 0,
      y: itemRawH * initialIndex,
      animated: false
    })
  }

  const onItemLayout = (e: LayoutChangeEvent) => {
    const { height: rawH } = e.nativeEvent.layout
    if (rawH && itemRawH !== rawH) {
      setItemRawH(rawH)
      onColumnItemRawHChange(rawH)
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

  const offsetY = useRef(new Animated.Value(0)).current

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: offsetY } } }], {
        useNativeDriver: true
      }),
    [offsetY]
  )

  const faces = useMemo(() => createFaces(itemRawH, visibleCount), [itemRawH])

  const getTransform = useCallback(
    (index: number) => {
      const inputRange = faces.map((f) => itemRawH * (index + f.index))
      return {
        opacity: offsetY.interpolate({
          inputRange: inputRange,
          outputRange: faces.map((x) => x.opacity),
          extrapolate: 'clamp'
        }),
        rotateX: offsetY.interpolate({
          inputRange: inputRange,
          outputRange: faces.map((x) => `${x.deg}deg`),
          extrapolate: 'extend'
        }),
        translateY: offsetY.interpolate({
          inputRange: inputRange,
          outputRange: faces.map((x) => x.offsetY),
          extrapolate: 'extend'
        })
      }
    },
    [offsetY, faces, itemRawH]
  )

  const renderInnerchild = () =>
    columnData.map((item: React.ReactNode, index: number) => {
      const InnerProps = index === 0 ? { onLayout: onItemLayout } : {}
      const strKey = `picker-column-${columnIndex}-${index}`
      const { opacity, rotateX, translateY } = getTransform(index)
      return (
        <Animated.View
          key={strKey}
          {...InnerProps}
          style={[
            {
              height: itemHeight,
              width: '100%',
              opacity,
              transform: [
                { translateY },
                { rotateX },
                { perspective: 1000 } // 适配 Android
              ]
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
        </Animated.View>
      )
    })

  const renderScollView = () => {
    return (
      <Animated.ScrollView
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
        contentOffset={initialOffset}
        snapToOffsets={snapToOffsets}
        onContentSizeChange={onContentSizeChange}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {renderInnerchild()}
      </Animated.ScrollView>
    )
  }

  const renderOverlay = () => (
    <PickerOverlay itemHeight={itemHeight} overlayItemStyle={pickerOverlayStyle} />
  )

  return (
    <SafeAreaView style={[{ display: 'flex', flex: 1 }]}>
      {renderScollView()}
      {renderOverlay()}
    </SafeAreaView>
  )
})

_PickerViewColumn.displayName = 'MpxPickerViewColumn'
export default _PickerViewColumn
