
import { View, Animated, SafeAreaView, NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent, ScrollView } from 'react-native'
import React, { forwardRef, useRef, useState, useEffect, useMemo } from 'react'
import { useTransformStyle, splitStyle, splitProps, wrapChildren, useLayout, useDebouncedCallback } from './utils'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import type { AnyFunc } from './types/common'

interface ColumnProps {
  children?: React.ReactNode,
  columnData: React.ReactNode[],
  initialIndex: number,
  onColumnLayoutChange: Function,
  getInnerLayout: Function,
  onSelectChange: AnyFunc,
  onChanging: AnyFunc,
  onChanged: AnyFunc,
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
    onChanging,
    onChanged,
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

  // 每个元素的原始高度
  const [itemRawH, setItemRawH] = useState(0)
  // 原始高度四舍五入后的高度
  const [itemRoundH, setItemRoundH] = useState(0)

  const maxIndex = useMemo(() => realChilds.length - 1, [realChilds])

  const activeIndex = useRef(initialIndex)

  useEffect(() => {
    if (!itemRawH) {
      return
    }
    const offsetY = itemRawH * initialIndex
    scrollViewRef.current?.scrollTo({ x: 0, y: offsetY, animated: true })
  }, [initialIndex, itemRawH])

  const onScrollViewLayout = () => {
    getInnerLayout && getInnerLayout(layoutRef)
  }

  const {
    // 存储layout布局信息
    layoutRef,
    layoutProps
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: scrollViewRef, onLayout: onScrollViewLayout })

  const onItemLayout = (e: LayoutChangeEvent) => {
    const layout = e.nativeEvent.layout
    if (layout.height && itemRawH !== layout.height) {
      const rawH = layout.height
      const roundH = Math.round(rawH)
      setItemRawH(rawH)
      setItemRoundH(roundH)
      onColumnLayoutChange && onColumnLayoutChange({ height: rawH * 5 })
    }
  }

  const onSelectChangeDebounce = useDebouncedCallback(onSelectChange, 300)

  useEffect(() => {
    return () => {
      onSelectChangeDebounce.clear()
    }
  }, [onSelectChangeDebounce])

  const onTouchStart = () => {
    onSelectChangeDebounce.clear()
  }

  const onTouchEnd = () => {
    if (activeIndex.current !== initialIndex) {
      onSelectChangeDebounce(activeIndex.current)
    }
  }

  const onMomentumScrollBegin = () => {
    onChanging(columnIndex)
    onSelectChangeDebounce.clear()
  }

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onChanged(columnIndex)
    if (!scrollViewRef.current || !itemRoundH) {
      return
    }
    const { y: scrollY } = e.nativeEvent.contentOffset
    let calcIndex = Math.round(scrollY / itemRoundH)
    if (calcIndex === initialIndex) {
      // 选中不变时微调
      scrollViewRef.current.scrollTo({ x: 0, y: calcIndex * itemRawH, animated: true })
      onSelectChangeDebounce.clear()
    } else {
      // 选中变化时重渲染
      calcIndex = Math.max(0, Math.min(calcIndex, maxIndex)) || 0
      activeIndex.current = calcIndex
      onSelectChangeDebounce(calcIndex)
    }
  }

  const renderInnerchild = () => {
    const arrChild = realChilds.map((item: React.ReactNode, index: number) => {
      const InnerProps = index === 0 ? { onLayout: onItemLayout } : {}
      const strKey = `picker-${columnIndex}-column-${index}`
      const arrHeight = (wrapperStyle.itemHeight + '').match(/\d+/g) || []
      const iHeight = (arrHeight[0] || DefaultItemHeight) as number
      return <View key={strKey} {...InnerProps} style={[{ height: iHeight, width: '100%' }]}>
        {wrapChildren(
          {
            children: item
          },
          {
            hasVarDec,
            varContext: varContextRef.current,
            textStyle,
            textProps
          }
        )}
      </View>
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
        horizontal={false}
        ref={scrollViewRef}
        bounces={true}
        scrollsToTop={false}
        removeClippedSubviews={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={itemRawH}
        automaticallyAdjustContentInsets={false}
        {...layoutProps}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {renderInnerchild()}
    </Animated.ScrollView>)
  }

  return (
    <SafeAreaView style={[{ display: 'flex', flex: 1 }]}>
      {renderScollView()}
    </SafeAreaView>
  )
})

_PickerViewColumn.displayName = 'mpx-picker-view-column'
export default _PickerViewColumn
