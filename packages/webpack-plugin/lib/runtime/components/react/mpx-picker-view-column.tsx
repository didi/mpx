
import { View, Animated, SafeAreaView, NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent, ScrollView } from 'react-native'
import React, { forwardRef, useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { useTransformStyle, splitStyle, splitProps, wrapChildren, useLayout, usePrevious } from './utils'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { createFaces } from './pickerFaces'

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
    height?: number
    itemHeight: string
  }
  columnIndex: number
}

// 默认的单个选项高度
const DefaultItemHeight = 36
const visibleCount = 5

const _PickerViewColumn = forwardRef<HandlerRef<ScrollView & View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const {
    columnData: realChilds,
    columnIndex,
    initialIndex,
    onSelectChange,
    onColumnItemRawHChange,
    getInnerLayout,
    style,
    wrapperStyle,
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

  const [itemRawH, setItemRawH] = useState(0) // 单个选项真实渲染高度
  const maxIndex = useMemo(() => realChilds.length - 1, [realChilds])
  const touching = useRef(false)
  const scrolling = useRef(false)
  const prevIndex = usePrevious(initialIndex)

  const initialOffset = useMemo(() => ({
    x: 0,
    y: itemRawH * initialIndex
  }), [itemRawH])

  const snapToOffsets = useMemo(
    () => realChilds.map((_, i) => i * itemRawH),
    [realChilds, itemRawH]
  )

  const contentContainerStyle = useMemo(() => {
    const { height = itemRawH * visibleCount } = wrapperStyle
    return [
      {
        paddingVertical: Math.max(0, (height - itemRawH) / 2)
      }
    ]
  }, [itemRawH, wrapperStyle])

  useEffect(() => {
    if (
      !scrollViewRef.current ||
      !itemRawH ||
      touching.current ||
      scrolling.current ||
      prevIndex == null ||
      prevIndex === initialIndex
    ) {
      return
    }
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

  const renderInnerchild = () => {
    return realChilds.map((item: React.ReactNode, index: number) => {
      const InnerProps = index === 0 ? { onLayout: onItemLayout } : {}
      const strKey = `picker-column-${columnIndex}-${index}`
      const arrHeight = (wrapperStyle.itemHeight + '').match(/\d+/g) || []
      const iHeight = (arrHeight[0] || DefaultItemHeight) as number
      const { opacity, rotateX, translateY } = getTransform(index)
      return (
        <Animated.View
          key={strKey}
          {...InnerProps}
          style={[
            {
              height: iHeight,
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
  }

  const renderScollView = () => {
    return (
      <Animated.ScrollView
        ref={scrollViewRef}
        bounces={true}
        horizontal={false}
        pagingEnabled={false}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        {...layoutProps}
        scrollEventThrottle={16}
        contentContainerStyle={contentContainerStyle}
        contentOffset={initialOffset}
        snapToOffsets={snapToOffsets}
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

  return (
    <SafeAreaView style={[{ display: 'flex', flex: 1 }]}>
      {renderScollView()}
    </SafeAreaView>
  )
})

_PickerViewColumn.displayName = 'mpx-picker-view-column'
export default _PickerViewColumn
