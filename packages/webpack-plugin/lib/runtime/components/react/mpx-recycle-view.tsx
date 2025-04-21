import React, { forwardRef, useRef, useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, LayoutChangeEvent, Animated } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { HandlerRef } from './useNodesRef'

interface RecycleViewProps {
  scrollY?: boolean;
  height?: number;
  width?: number;
  itemHeight?: {
    value?: number;
    getter?: (item: any, index: number) => number;
  };
  bufferScale?: number;
  listData?: any[];
  scrollTop?: number;
  scrollWithAnimation?: boolean;
  enableBackToTop?: boolean;
  lowerThreshold?: number;
  upperThreshold?: number;
  scrollOptions?: Record<string, any>;
  scrollEventThrottle?: number;
  minRenderCount?: number;
  enhanced?: boolean;
  bounces?: boolean;
  onScroll?: (e: any) => void;
  onScrollToUpper?: (e: any) => void;
  onScrollToLower?: (e: any) => void;
  children?: React.ReactNode;
}

const getGenericComponent = ({ props, ref, generichash, generickey }) => {
  const GenericComponent = global.__mpxGenericsMap[generichash](generickey)
  return <GenericComponent ref={ref} {...props}/>
}

const Item = forwardRef((props, ref) => {
  const { generichash, genericrecycleItem } = props
  return getGenericComponent({ props, ref, generichash, generickey: genericrecycleItem })
})

const RecycleView = forwardRef<HandlerRef<View, RecycleViewProps>, RecycleViewProps>(({
  scrollY = true,
  height = 0,
  width = 0,
  itemHeight = {},
  bufferScale = 2,
  listData = [],
  scrollTop = 0,
  scrollWithAnimation = false,
  enableBackToTop = false,
  lowerThreshold = 50,
  upperThreshold = 50,
  scrollOptions = {},
  scrollEventThrottle = 0,
  minRenderCount = 5,
  enhanced = false,
  bounces = false,
  onScroll: onScrollProp,
  onScrollToUpper,
  onScrollToLower,
  children,
  generichash,
  'genericrecycle-item': genericrecycleItem,
  'genericsection-header': genericsectionHeader,
  'genericsection-footer': genericsectionFooter,
  'genericlist-header': genericlistHeader,
  'genericlist-footer': genericlistFooter
}, ref) : React.JSX.Element => {
  const scrollViewRef = useRef<ScrollView>(null)

  const [containerHeight, setContainerHeight] = useState(0)
  const [_listData, setListData] = useState(listData)
  const [positions, setPositions] = useState<Array<{
    index: number;
    height: number;
    top: number;
    bottom: number;
  }>>([])
  const [totalHeight, setTotalHeight] = useState(0)
  const [visibleCounts, setVisibleCounts] = useState<number[]>([])
  const [visibleData, setVisibleData] = useState([])

  const startIndexValueRef = useRef(0)
  const endIndexValueRef = useRef(0)
  const transformYRef = useRef(new Animated.Value(0)).current
  const lastScrollTimeRef = useRef(0)

  useEffect(() => {
    const data = listData.map((item, index) => ({
      ...item,
      _index: `_${index}`
    }))
    setListData(data)
    initPositions()
  }, [listData])

  useEffect(() => {
    setStartOffset()
  }, [positions])

  const getItemHeight = useCallback((item: any, index: number) => {
    const { value, getter } = itemHeight
    if (typeof getter === 'function') {
      return getter(item, index) || 0
    }
    return value || 0
  }, [itemHeight])

  function initPositions () {
    let bottom = 0
    const newPositions = _listData.map((item, index) => {
      const height = getItemHeight(item, index)
      const position = {
        index,
        height,
        top: bottom,
        bottom: bottom + height
      }
      bottom = position.bottom
      return position
    })
    setPositions(newPositions)
    setTotalHeight(!newPositions.length ? 0 : newPositions[newPositions.length - 1].bottom)

    if (containerHeight) {
      calculateVisibleCounts(newPositions)
    }
  }

  const calculateVisibleCounts = useCallback((currentPositions = positions) => {
    const newVisibleCounts = currentPositions.map((_, startIndex) => {
      let count = 0
      let totalHeight = 0

      for (let i = startIndex; i < currentPositions.length; i++) {
        totalHeight += currentPositions[i].height
        if (totalHeight > containerHeight) {
          break
        }
        count++
      }

      if (startIndex + count > currentPositions.length - 3) {
        count = currentPositions.length - startIndex
      }

      return count
    })

    setVisibleCounts(newVisibleCounts)
  }, [containerHeight])

  useEffect(() => {
    calculateVisibleCounts(positions)
  }, [containerHeight])

  const renderItem = useCallback(({ item }) => (
    <Item currentItem={item} generichash={generichash} genericrecycleItem={genericrecycleItem} key={item._index}/>
  ), [])

  const binarySearch = useCallback((list: typeof positions, value: number) => {
    if (!list.length) return 0

    if (value >= list[list.length - 1].bottom) {
      return list.length - 1
    }

    let start = 0
    let end = list.length - 1

    while (start <= end) {
      const midIndex = Math.floor((start + end) / 2)
      const midValue = list[midIndex]

      if (value >= midValue.top && value < midValue.bottom) {
        return midIndex
      }

      if (value < midValue.top) {
        end = midIndex - 1
      } else {
        start = midIndex + 1
      }
    }

    return Math.min(Math.max(0, start - 1), list.length - 1)
  }, [])

  const getStartIndex = (scrollTop: number) => {
    if (!positions.length) return 0
    if (scrollTop <= 0) return 0
    const index = binarySearch(positions, scrollTop)
    return Math.max(0, Math.min(index, _listData.length - 1))
  }

  const getVisibleCount = () => {
    if (!visibleCounts.length) return minRenderCount
    return Math.max(visibleCounts[startIndexValueRef.current], minRenderCount)
  }

  const getAboveCount = () => {
    if (!_listData.length || !visibleCounts.length) return 0
    let count = 0
    const startIdx = Math.max(0, startIndexValueRef.current)
    const endIdx = Math.max(0, startIdx - bufferScale)

    for (let i = startIdx; i > endIdx; i--) {
      count += visibleCounts[i] || 0
    }

    return count
  }

  const getBelowCount = () => {
    if (!_listData.length || !visibleCounts.length) return 0
    let count = 0
    const startIdx = Math.min(startIndexValueRef.current, _listData.length - 1)
    const endIdx = Math.min(startIdx + bufferScale, _listData.length - 1)

    for (let i = startIdx; i < endIdx; i++) {
      count += visibleCounts[i] || 0
    }

    return count
  }

  const getVisibleData = () => {
    if (!_listData.length) return []

    const currentStart = startIndexValueRef.current

    const startIdx = Math.min(Math.max(0, currentStart - getAboveCount()), _listData.length - 1)
    let endIdx = Math.min(_listData.length, currentStart + getVisibleCount() + getBelowCount())

    if (endIdx > _listData.length - 3) {
      endIdx = _listData.length
    }

    return _listData.slice(startIdx, endIdx).map((item, idx) => {
      const realIndex = startIdx + idx
      return {
        ...item,
        _index: `_${realIndex}`
      }
    })
  }

  const handleScroll = (e) => {
    const now = Date.now()
    // 添加16ms的节流，大约60fps
    if (now - lastScrollTimeRef.current < 16) {
      return
    }
    lastScrollTimeRef.current = now
    const newStart = getStartIndex(e.nativeEvent.contentOffset.y)
    if (Math.abs(newStart - endIndexValueRef.current) >= Math.floor(getAboveCount() / 2)) {
      startIndexValueRef.current = newStart
      endIndexValueRef.current = newStart + getVisibleCount()
      setStartOffset()
    }
    onScrollProp?.(e)
  }

  function setStartOffset () {
    if (positions.length) {
      const startIdx = Math.min(
        Math.max(0, startIndexValueRef.current - getAboveCount()),
        positions.length - 1
      )
      const offset = positions[startIdx].top
      const data = getVisibleData()
      setVisibleData(data)
      transformYRef.setValue(offset)
    } else {
      transformYRef.setValue(0)
    }
  }

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { height: newHeight } = e.nativeEvent.layout
    setContainerHeight(newHeight)
  }, [])

  useEffect(() => {
    const newStart = getStartIndex(scrollTop)
    const newEnd = newStart + getVisibleCount()
    startIndexValueRef.current = newStart
    endIndexValueRef.current = newEnd
    setStartOffset()
  }, [scrollTop])

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { width: width || '100%', height: height || '100%' } as ViewStyle]}
      bounces={bounces}
      onScroll={handleScroll}
      onLayout={handleLayout}
    >
      <View style={styles.contentWrapper}>
        <View style={[styles.placeholder, { height: totalHeight }]} />
        <Animated.View
          style={[
            styles.infiniteList,
            {
              transform: [{ translateY: transformYRef }]
            }
          ]}
        >
          {visibleData.map((item) => (
            renderItem({item})
          ))}
        </Animated.View>
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden'
  },
  contentWrapper: {
    position: 'relative',
    width: '100%'
  },
  placeholder: {
    width: '100%'
  },
  infiniteList: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backfaceVisibility: 'hidden'
  }
})

RecycleView.displayName = 'MpxRecycleView'

export default RecycleView
