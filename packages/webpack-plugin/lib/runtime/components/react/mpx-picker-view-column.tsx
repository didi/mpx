
import { View, Animated, SafeAreaView, NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent, ScrollView } from 'react-native'
import Reanimated, { useAnimatedRef, useScrollViewOffset, useAnimatedStyle, interpolate, Extrapolation, AnimatedRef } from 'react-native-reanimated'
import React, { forwardRef, useState, useMemo, useCallback } from 'react'
import { useTransformStyle, splitStyle, splitProps, wrapChildren, useLayout } from './utils'
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

  const animatedRef = useAnimatedRef<ScrollView>()
  const offsetYShared = useScrollViewOffset(animatedRef as AnimatedRef<Reanimated.ScrollView>)

  useNodesRef(props, ref, animatedRef, {})

  const [itemRawH, setItemRawH] = useState(0) // 单个选项真实渲染高度
  const maxIndex = useMemo(() => realChilds.length - 1, [realChilds])

  const initialOffset = useMemo(() => ({
    x: 0,
    y: itemRawH * initialIndex
  }), [itemRawH])

  const snapToOffsets = useMemo(
    () => realChilds.map((_, i) => i * itemRawH),
    [realChilds, itemRawH]
  )

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
    nodeRef: animatedRef,
    onLayout: onScrollViewLayout
  })

  const onItemLayout = (e: LayoutChangeEvent) => {
    const { height: rawH } = e.nativeEvent.layout
    if (rawH && itemRawH !== rawH) {
      setItemRawH(rawH)
      onColumnItemRawHChange(rawH)
    }
  }

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
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

  const faces = useMemo(() => createFaces(itemRawH, visibleCount), [itemRawH])

  const getAnimatedStyles = useCallback(
    (index: number) =>
      useAnimatedStyle(() => {
        const inputRange = faces.map((f) => itemRawH * (index + f.index))
        return {
          opacity: interpolate(offsetYShared.value, inputRange, faces.map((x) => x.opacity), Extrapolation.CLAMP),
          transform: [
            { rotateX: interpolate(offsetYShared.value, inputRange, faces.map((x) => x.deg), Extrapolation.EXTEND) + 'deg' },
            { translateY: interpolate(offsetYShared.value, inputRange, faces.map((x) => x.offsetY), Extrapolation.EXTEND) }
          ]
        }
      }),
    [offsetYShared, faces, itemRawH]
  )

  const renderInnerchild = () => {
    const arrChild = realChilds.map((item: React.ReactNode, index: number) => {
      const InnerProps = index === 0 ? { onLayout: onItemLayout } : {}
      const strKey = `picker-column-${columnIndex}-${index}`
      const arrHeight = (wrapperStyle.itemHeight + '').match(/\d+/g) || []
      const iHeight = (arrHeight[0] || DefaultItemHeight) as number
      const animatedStyles = getAnimatedStyles(index)
      return (
        <Reanimated.View
          key={strKey}
          {...InnerProps}
          style={[{ height: iHeight, width: '100%' }, animatedStyles]}
        >
          {wrapChildren(
            { children: item },
            { hasVarDec, varContext: varContextRef.current, textStyle, textProps }
          )}
        </Reanimated.View>
      )
    })
    let offset = 0
    if (wrapperStyle.height) {
      offset = Math.ceil((wrapperStyle.height - itemRawH) / 2)
    }
    arrChild.unshift(<View key={'picker-column-dummy-head'} style={[{ height: offset }]}></View>)
    arrChild.push(<View key={'picker-column-dummy-tail'} style={[{ height: offset }]}></View>)
    return arrChild
  }

  const renderScollView = () => {
    return (
      <Animated.ScrollView
        ref={animatedRef}
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
