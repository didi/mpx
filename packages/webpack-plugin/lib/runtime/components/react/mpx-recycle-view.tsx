import React, { forwardRef, useRef, useState, useEffect, useMemo, createElement, useImperativeHandle } from 'react'
import { RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import { extendObject, useLayout, useTransformStyle } from './utils'

// 扁平化后的 item 类型
interface FlatListItem {
  type: 'header' | 'item';
  data: any;
  originalIndex: number;
  sectionIndex?: number;
}

interface ListItem {
  isSectionHeader?: boolean;
  _originalItemIndex?: number;
  [key: string]: any;
}

interface ItemHeightType {
  value?: number;
  getter?: (item: any, index: number) => number;
}

interface RecycleViewProps {
  enhanced?: boolean;
  bounces?: boolean;
  scrollEventThrottle?: number;
  height?: number | string;
  width?: number | string;
  listData?: ListItem[];
  generichash?: string;
  style?: Record<string, any>;
  itemHeight?: ItemHeightType;
  sectionHeaderHeight?: ItemHeightType;
  listHeaderData?: any;
  listHeaderHeight?: ItemHeightType;
  useListHeader?: boolean;
  'genericrecycle-item'?: string;
  'genericsection-header'?: string;
  'genericlist-header'?: string;
  'enable-var'?: boolean;
  'external-var-context'?: any;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  'enable-sticky'?: boolean;
  'enable-back-to-top'?: boolean;
  'end-reached-threshold'?: number;
  'refresher-enabled'?: boolean;
  'show-scrollbar'?: boolean;
  'refresher-triggered'?: boolean;
  bindrefresherrefresh?: (event: any) => void;
  bindscrolltolower?: (event: any) => void;
  bindscroll?: (event: any) => void;
  [key: string]: any;
}

interface ScrollPositionParams {
  index: number;
  animated?: boolean;
  viewOffset?: number;
  viewPosition?: number;
}

const getGeneric = (generichash: string, generickey: string) => {
  if (!generichash || !generickey) return null
  const GenericComponent = global.__mpxGenericsMap?.[generichash]?.[generickey]?.()
  if (!GenericComponent) return null

  return forwardRef((props: any, ref: any) => {
    return createElement(GenericComponent, extendObject({}, {
      ref: ref
    }, props))
  })
}

const getListHeaderComponent = (generichash: string, generickey: string, data: any) => {
  if (!generichash || !generickey) return undefined
  const ListHeaderComponent = getGeneric(generichash, generickey)
  return ListHeaderComponent ? createElement(ListHeaderComponent, { listHeaderData: data }) : null
}

const RecycleView = forwardRef<any, RecycleViewProps>((props = {}, ref) => {
  const {
    enhanced = false,
    bounces = true,
    scrollEventThrottle = 0,
    height,
    width,
    listData = [],
    generichash,
    style = {},
    itemHeight = {},
    sectionHeaderHeight = {},
    listHeaderHeight = {},
    listHeaderData = null,
    useListHeader = true,
    'genericrecycle-item': genericrecycleItem,
    'genericsection-header': genericsectionHeader,
    'genericlist-header': genericListHeader,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    'enable-sticky': enableSticky = false,
    'enable-back-to-top': enableBackToTop = false,
    'end-reached-threshold': onEndReachedThreshold = 0.1,
    'refresher-enabled': refresherEnabled,
    'show-scrollbar': showScrollbar = true,
    'refresher-triggered': refresherTriggered
  } = props

  const [refreshing, setRefreshing] = useState(!!refresherTriggered)

  const scrollViewRef = useRef<FlashList<FlatListItem> | null>(null)

  // 原始索引 -> 扁平列表索引的映射
  const indexMap = useRef<{ [key: number]: number }>({})

  const {
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: scrollViewRef })

  useEffect(() => {
    if (refreshing !== refresherTriggered) {
      setRefreshing(!!refresherTriggered)
    }
  }, [refresherTriggered])

  const onRefresh = () => {
    const { bindrefresherrefresh } = props
    bindrefresherrefresh &&
      bindrefresherrefresh(
        getCustomEvent('refresherrefresh', {}, { layoutRef }, props)
      )
  }

  const onEndReached = () => {
    const { bindscrolltolower } = props
    bindscrolltolower &&
      bindscrolltolower(
        getCustomEvent('scrolltolower', {}, { layoutRef }, props)
      )
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { bindscroll } = props
    bindscroll &&
      bindscroll(
        getCustomEvent('scroll', event.nativeEvent, { layoutRef }, props)
      )
  }

  // 将 listData 转换为扁平化数组，同时计算 sticky header 索引
  const { flatData, stickyIndices } = useMemo(() => {
    const flat: FlatListItem[] = []
    const sticky: number[] = []
    indexMap.current = {}

    let sectionIndex = -1

    listData.forEach((item: ListItem, index: number) => {
      if (item.isSectionHeader) {
        sectionIndex++
        // 记录 sticky header 的索引
        if (enableSticky) {
          sticky.push(flat.length)
        }
        flat.push({
          type: 'header',
          data: item,
          originalIndex: index,
          sectionIndex
        })
        // 原始索引 -> 扁平索引
        indexMap.current[index] = flat.length - 1
      } else {
        flat.push({
          type: 'item',
          data: extendObject({}, item, { _originalItemIndex: index }),
          originalIndex: index,
          sectionIndex: sectionIndex >= 0 ? sectionIndex : 0
        })
        indexMap.current[index] = flat.length - 1
      }
    })

    return { flatData: flat, stickyIndices: sticky }
  }, [listData, enableSticky])

  const scrollToIndex = ({ index, animated = true, viewOffset = 0 }: ScrollPositionParams) => {
    if (scrollViewRef.current) {
      const flatIndex = indexMap.current[index]
      if (flatIndex !== undefined) {
        scrollViewRef.current.scrollToIndex({
          index: flatIndex,
          animated,
          viewOffset
        })
      }
    }
  }

  // 根据 item 类型返回高度
  const getItemSize = (item: FlatListItem, index: number): number => {
    if (item.type === 'header') {
      if ((sectionHeaderHeight as ItemHeightType).getter) {
        return (sectionHeaderHeight as ItemHeightType).getter?.(item.data, item.originalIndex) || 0
      }
      return (sectionHeaderHeight as ItemHeightType).value || 0
    } else {
      if ((itemHeight as ItemHeightType).getter) {
        return (itemHeight as ItemHeightType).getter?.(item.data, item.originalIndex) || 0
      }
      return (itemHeight as ItemHeightType).value || 0
    }
  }

  // FlashList 的 overrideItemLayout
  const overrideItemLayout = (layout: { span?: number; size?: number }, item: FlatListItem, index: number) => {
    layout.size = getItemSize(item, index)
  }

  // 获取 item 类型，用于 FlashList 的类型分离优化
  const getItemType = (item: FlatListItem): string => {
    return item.type
  }

  // 渲染单个 item (包括 header 和普通 item)
  const renderItem = ({ item }: { item: FlatListItem }) => {
    if (item.type === 'header') {
      const SectionHeaderComponent = getGeneric(generichash, genericsectionHeader)
      return SectionHeaderComponent ? createElement(SectionHeaderComponent, { itemData: item.data }) : null
    } else {
      const ItemComponent = getGeneric(generichash, genericrecycleItem)
      return ItemComponent ? createElement(ItemComponent, { itemData: item.data }) : null
    }
  }

  // 估算 item 平均大小，FlashList 需要这个值来优化渲染
  const estimatedItemSize = useMemo(() => {
    const headerSize = (sectionHeaderHeight as ItemHeightType).value || 50
    const normalSize = (itemHeight as ItemHeightType).value || 50
    const totalCount = flatData.length
    const headerCount = stickyIndices.length

    // 如果没有数据，返回默认值
    if (totalCount === 0) {
      return normalSize
    }

    // 如果有 section header，使用加权平均
    if (headerCount > 0) {
      const itemCount = totalCount - headerCount
      return (headerCount * headerSize + itemCount * normalSize) / totalCount
    }

    return normalSize
  }, [sectionHeaderHeight, itemHeight, flatData.length, stickyIndices.length])

  // keyExtractor 用于生成唯一 key
  const keyExtractor = (item: FlatListItem, index: number): string => {
    return `${item.type}_${item.originalIndex}_${index}`
  }

  const scrollAdditionalProps = extendObject(
    {
      scrollEventThrottle: scrollEventThrottle,
      scrollsToTop: enableBackToTop,
      showsVerticalScrollIndicator: showScrollbar,
      showsHorizontalScrollIndicator: showScrollbar,
      onEndReachedThreshold,
      bounces: false,
      onScroll: onScroll,
      onEndReached: onEndReached
    },
    layoutProps
  )

  if (enhanced) {
    Object.assign(scrollAdditionalProps, {
      bounces
    })
  }
  if (refresherEnabled) {
    Object.assign(scrollAdditionalProps, {
      refreshing: refreshing
    })
  }

  useImperativeHandle(ref, () => {
    return {
      ...props,
      scrollToIndex
    }
  })

  const innerProps = useInnerProps(extendObject({}, props, scrollAdditionalProps), [
    'id',
    'show-scrollbar',
    'lower-threshold',
    'refresher-triggered',
    'refresher-enabled',
    'bindrefresherrefresh'
  ], { layoutRef })

  return createElement(
    FlashList,
    extendObject(
      {
        ref: scrollViewRef,
        contentContainerStyle: { backgroundColor: style.backgroundColor },
        style: [{ height, width }, style, layoutStyle],
        data: flatData,
        renderItem: renderItem,
        keyExtractor: keyExtractor,
        getItemType: getItemType,
        estimatedItemSize: estimatedItemSize,
        overrideItemLayout: overrideItemLayout,
        stickyHeaderIndices: enableSticky && stickyIndices.length > 0 ? stickyIndices : undefined,
        ListHeaderComponent: useListHeader ? getListHeaderComponent(generichash, genericListHeader, listHeaderData) : null,
        refreshControl: refresherEnabled
          ? React.createElement(RefreshControl, {
            onRefresh: onRefresh,
            refreshing: refreshing
          })
          : undefined
      },
      innerProps
    )
  )
})

export default RecycleView
