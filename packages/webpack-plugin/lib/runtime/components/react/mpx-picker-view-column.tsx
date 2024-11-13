
import { View, Animated, SafeAreaView, NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent, ScrollView } from 'react-native'
import React, { forwardRef, useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useTransformStyle, splitStyle, splitProps, wrapChildren, useLayout, useDebouncedCallback } from './utils'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import type { AnyFunc } from './types/common'
import { createFaces } from './faces'

interface ColumnProps {
  children?: React.ReactNode,
  columnData: React.ReactNode[],
  initialIndex: number,
  onColumnLayoutChange: Function,
  getInnerLayout: Function,
  onSelectChange: AnyFunc,
  style: {
    [key: string]: any
  },
  'enable-var': boolean
  'external-var-context'?: Record<string, any>
  wrapperStyle: {
    height?: number,
    itemHeight: string
  },
  columnIndex: number
}

// 每个Column 都有个外层的高度, 内部的元素高度
// 默认的高度
const DefaultItemHeight = 36

const _PickerViewColumn = forwardRef<HandlerRef<ScrollView & View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const {
    columnData: realChilds,
    columnIndex,
    initialIndex,
    onSelectChange,
    onColumnLayoutChange,
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
  const activeIndex = useRef(initialIndex)

  const initialOffset = useMemo(() => ({
    x: 0,
    y: itemRawH * initialIndex
  }), [itemRawH])

  const snapToOffsets = useMemo(
    () => realChilds.map((_, i) => i * itemRawH),
    [realChilds, itemRawH]
  )

  const onSelectChangeDebounce = useDebouncedCallback(onSelectChange, 300)

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
    const { height } = e.nativeEvent.layout
    if (height && itemRawH !== height) {
      setItemRawH(height)
      onColumnLayoutChange && onColumnLayoutChange({ height: height * 5 })
    }
  }

  const onTouchStart = () => {
    onSelectChangeDebounce.clear()
  }

  const onTouchEnd = () => {
    if (activeIndex.current !== initialIndex) {
      onSelectChangeDebounce(activeIndex.current)
    }
  }

  const onMomentumScrollBegin = () => {
    onSelectChangeDebounce.clear()
  }

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!scrollViewRef.current || !itemRawH) {
      return
    }
    const { y: scrollY } = e.nativeEvent.contentOffset
    let calcIndex = Math.round(scrollY / itemRawH)
    activeIndex.current = calcIndex
    if (calcIndex === initialIndex) {
      onSelectChangeDebounce.clear()
    } else {
      calcIndex = Math.max(0, Math.min(calcIndex, maxIndex)) || 0
      onSelectChangeDebounce(calcIndex)
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

  const faces = useMemo(() => createFaces(itemRawH, 5), [itemRawH])

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
    const arrChild = realChilds.map((item: React.ReactNode, index: number) => {
      const InnerProps = index === 0 ? { onLayout: onItemLayout } : {}
      const strKey = `picker-${columnIndex}-column-${index}`
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
                { translateY }, // first translateY, then rotateX for correct transformation.
                { rotateX },
                { perspective: 1000 } // without this line this Animation will not render on Android https://reactnative.dev/docs/animations#bear-in-mind
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
    const totalHeight = itemRawH * 5
    let fix = 0
    if (wrapperStyle.height && totalHeight !== wrapperStyle.height) {
      fix = Math.ceil((totalHeight - wrapperStyle.height) / 2)
    }
    arrChild.unshift(<View key={`picker-${columnIndex}-column-head-0`} style={[{ height: itemRawH - fix }]}></View>)
    arrChild.unshift(<View key={`picker-${columnIndex}-column-head-1`} style={[{ height: itemRawH }]}></View>)
    arrChild.push(<View key={`picker-${columnIndex}-column-tail-0`} style={[{ height: itemRawH }]}></View>)
    arrChild.push(<View key={`picker-${columnIndex}-column-tail-1`} style={[{ height: itemRawH - fix }]}></View>)
    return arrChild
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
        contentOffset={initialOffset}
        snapToOffsets={snapToOffsets}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
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
