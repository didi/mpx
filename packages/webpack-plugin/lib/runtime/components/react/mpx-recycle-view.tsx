import React, { forwardRef, useRef, useCallback, useState, useEffect, useMemo, ForwardedRef, ReactElement } from 'react'
import { SectionList, FlatList, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef from './useNodesRef'
import { extendObject, useLayout, useTransformStyle } from './utils'

interface GenericComponentProps {
  props: Record<string, any>;
  ref: ForwardedRef<any>;
  generichash: string;
  generickey: string;
}

interface ItemProps {
  generichash: string;
  genericrecycleItem: string;
  itemData: any;
}

interface SectionHeaderProps {
  generichash: string;
  genericsectionHeader: string;
  itemData: any;
}

interface ListHeaderProps {
  generichash: string;
  genericlistHeader: string;
  listHeaderData: any;
}
interface ListItem {
  isSectionHeader?: boolean;
  _originalItemIndex?: number;
  [key: string]: any;
}

interface Section {
  headerData: ListItem | null;
  data: ListItem[];
  hasSectionHeader?: boolean;
  _originalItemIndex?: number;
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
  type?: 'normal' | 'section';
  generichash?: string;
  style?: Record<string, any>;
  itemHeight?: ItemHeightType;
  sectionHeaderHeight?: ItemHeightType;
  listHeaderData?: any;
  listHeaderHeight?: ItemHeightType;
  'genericrecycle-item'?: string;
  'genericsection-header'?: string;
  'enable-var'?: boolean;
  'external-var-context'?: any;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  'enable-sticky'?: boolean;
  'enable-back-to-top'?: boolean;
  'lower-threshold'?: number;
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

const getGenericComponent = ({ props, ref, generichash, generickey }: GenericComponentProps): ReactElement => {
  const GenericComponent = global.__mpxGenericsMap[generichash](generickey)
  return <GenericComponent ref={ref} {...props}/>
}

const Item = forwardRef<any, ItemProps>((props, ref) => {
  const { generichash, genericrecycleItem } = props
  return getGenericComponent({ props, ref, generichash, generickey: genericrecycleItem })
})

const SectionHeader = forwardRef<any, SectionHeaderProps>((props, ref) => {
  const { generichash, genericsectionHeader } = props
  return getGenericComponent({ props, ref, generichash, generickey: genericsectionHeader })
})

const ListHeader = forwardRef<any, ListHeaderProps>((props, ref) => {
  const { generichash, genericlistHeader } = props
  return getGenericComponent({ props, ref, generichash, generickey: genericlistHeader })
})

const RecycleView = forwardRef<any, RecycleViewProps>((props = {}, ref) => {
  const {
    enhanced = false,
    bounces = true,
    scrollEventThrottle = 0,
    height,
    width,
    listData,
    type,
    generichash,
    style = {},
    itemHeight = {},
    sectionHeaderHeight = {},
    listHeaderHeight = {},
    listHeaderData = null,
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
    'lower-threshold': lowerThreshold = 50,
    'refresher-enabled': refresherEnabled,
    'show-scrollbar': showScrollbar = true,
    'refresher-triggered': refresherTriggered
  } = props

  const [refreshing, setRefreshing] = useState(!!refresherTriggered)

  const scrollViewRef = useRef<any>(null)

  const indexMap = useRef<{ [key: string]: string | number }>({})

  const reverseIndexMap = useRef<{ [key: string]: number }>({})

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

  // 通过sectionIndex和rowIndex获取原始索引
  const getOriginalIndex = (sectionIndex: number, rowIndex: number | 'header'): number => {
    const key = `${sectionIndex}_${rowIndex}`
    return reverseIndexMap.current[key] ?? -1 // 如果找不到，返回-1
  }

  const scrollToIndex = ({ index, animated, viewOffset = 0, viewPosition = 0 }: ScrollPositionParams) => {
    if (scrollViewRef.current) {
      if (type === 'section') {
        // 通过索引映射表快速定位位置
        const position = indexMap.current[index]
        const [sectionIndex, itemIndex] = (position as string).split('_')
        scrollViewRef.current.scrollToLocation?.({
          itemIndex: itemIndex === 'header' ? 0 : Number(itemIndex) + 1,
          sectionIndex: Number(sectionIndex) || 0,
          animated,
          viewOffset,
          viewPosition
        })
      } else {
        scrollViewRef.current.scrollToIndex?.({ index, animated, viewOffset, viewPosition })
      }
    }
  }

  const getItemHeight = ({ sectionIndex, rowIndex }: { sectionIndex: number, rowIndex: number }) => {
    if (!itemHeight) {
      return 0
    }
    if ((itemHeight as ItemHeightType).getter) {
      if (type === 'section') {
        const item = convertedListData[sectionIndex].data[rowIndex]
        // 使用getOriginalIndex获取原始索引
        const originalIndex = getOriginalIndex(sectionIndex, rowIndex)
        return (itemHeight as ItemHeightType).getter?.(item, originalIndex) || 0
      } else {
        const item = convertedListData[rowIndex]
        return (itemHeight as ItemHeightType).getter?.(item, rowIndex) || 0
      }
    } else {
      return (itemHeight as ItemHeightType).value || 0
    }
  }

  const getSectionHeaderHeight = ({ sectionIndex }: { sectionIndex: number }) => {
    const item = convertedListData[sectionIndex]
    const { hasSectionHeader } = item
    // 使用getOriginalIndex获取原始索引
    const originalIndex = getOriginalIndex(sectionIndex, 'header')
    if (!hasSectionHeader) return 0
    if ((sectionHeaderHeight as ItemHeightType).getter) {
      return (sectionHeaderHeight as ItemHeightType).getter?.(item, originalIndex) || 0
    } else {
      return (sectionHeaderHeight as ItemHeightType).value || 0
    }
  }

  const renderItem = useCallback(({ item }: { item: any }) => (
    <Item itemData={item} generichash={generichash} genericrecycleItem={genericrecycleItem}/>
  ), [])

  const renderSectionHeader = useCallback((data: { section: Section }) => (
    !data.section.hasSectionHeader ? null : <SectionHeader itemData={data.section.headerData} generichash={generichash} genericsectionHeader={genericsectionHeader}/>
  ), [])

  const renderListHeader = useCallback(() => (
    <ListHeader listHeaderData={listHeaderData} generichash={generichash} genericlistHeader={genericListHeader}/>
  ), [])

  const convertToSectionListData = useCallback((data: ListItem[]): Section[] => {
    const sections: Section[] = []
    let currentSection: Section | null = null
    // 清空之前的索引映射
    indexMap.current = {}
    // 清空反向索引映射
    reverseIndexMap.current = {}

    data.forEach((item: ListItem, index: number) => {
      if (item.isSectionHeader) {
      // 如果已经存在一个 section，先把它添加到 sections 中
        if (currentSection) {
          sections.push(currentSection)
        }
        // 创建新的 section
        currentSection = {
          headerData: item,
          data: [],
          hasSectionHeader: true,
          _originalItemIndex: index
        }
        // 为 section header 添加索引映射
        const sectionIndex = sections.length
        indexMap.current[index] = `${sectionIndex}_header`
        // 添加反向索引映射
        reverseIndexMap.current[`${sectionIndex}_header`] = index
      } else {
      // 如果没有当前 section，创建一个默认的
        if (!currentSection) {
          // 创建默认section (无header的section)
          currentSection = {
            headerData: null,
            data: [],
            hasSectionHeader: false,
            _originalItemIndex: -1
          }
        }
        // 将 item 添加到当前 section 的 data 中
        const itemIndex = currentSection.data.length
        currentSection.data.push({
          ...item,
          _originalItemIndex: index
        })
        let sectionIndex
        // 为 item 添加索引映射 - 存储格式为: "sectionIndex_itemIndex"
        if (!currentSection.hasSectionHeader && sections.length === 0) {
          // 在默认section中(第一个且无header)
          sectionIndex = 0
          indexMap.current[index] = `${sectionIndex}_${itemIndex}`
        } else {
          // 在普通section中
          sectionIndex = sections.length
          indexMap.current[index] = `${sectionIndex}_${itemIndex}`
        }
        // 添加反向索引映射
        reverseIndexMap.current[`${sectionIndex}_${itemIndex}`] = index
      }
    })

    // 添加最后一个 section
    if (currentSection) {
      sections.push(currentSection)
    }

    return sections
  }, [])

  const convertedListData = useMemo(() => {
    if (type === 'section') {
      return convertToSectionListData(listData || []) || []
    } else {
      return listData
    }
  }, [listData])

  const itemLayouts = useMemo(() => {
    const layouts: Array<{ length: number, offset: number, index: number }> = []
    let offset = 0

    if (generichash && genericListHeader) {
      // 计算列表头部的高度
      offset += listHeaderHeight.getter?.() || listHeaderHeight.value || 0
    }

    if (type === 'section') {
      // 遍历所有 sections
      convertedListData.forEach((section: Section, sectionIndex: number) => {
      // 添加 section header 的位置信息
        const headerHeight = getSectionHeaderHeight({ sectionIndex })
        layouts.push({
          length: headerHeight,
          offset,
          index: layouts.length
        })
        offset += headerHeight

        // 添加该 section 中所有 items 的位置信息
        section.data.forEach((item: ListItem, itemIndex: number) => {
          const contenteight = getItemHeight({ sectionIndex, rowIndex: itemIndex })
          layouts.push({
            length: contenteight,
            offset,
            index: layouts.length
          })
          offset += contenteight
        })

        // 添加该 section 尾部位置信息
        // 因为即使 sectionList 没传 renderSectionFooter，getItemLayout 中的 index 的计算也会包含尾部节点
        layouts.push({
          length: 0,
          offset,
          index: layouts.length
        })
      })
    } else {
      convertedListData.forEach((item: ListItem, index: number) => {
        const itemHeightValue = getItemHeight({ sectionIndex: 0, rowIndex: index })
        layouts.push({
          length: itemHeightValue,
          offset,
          index: layouts.length
        })
        offset += itemHeightValue
      })
    }
    return layouts
  }, [convertedListData])

  const getItemLayout = useCallback((data: any, index: number) => {
    return itemLayouts[index]
  }, [itemLayouts])

  const scrollAdditionalProps = extendObject(
    {
      alwaysBounceVertical: false,
      alwaysBounceHorizontal: false,
      scrollEventThrottle: scrollEventThrottle,
      scrollsToTop: enableBackToTop,
      showsHorizontalScrollIndicator: showScrollbar,
      onEndReachedThreshold: lowerThreshold,
      ref: scrollViewRef,
      bounces: false,
      stickySectionHeadersEnabled: enableSticky,
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

  useNodesRef(props, ref, scrollViewRef, {
    scrollToIndex
  })

  const innerProps = useInnerProps(extendObject({}, props, scrollAdditionalProps), [
    'id',
    'show-scrollbar',
    'lower-threshold',
    'refresher-triggered',
    'refresher-enabled',
    'bindrefresherrefresh'
  ], { layoutRef })

  return (
    type === 'section'
      ? <SectionList
        {...innerProps as any}
        style={[{ height, width }, style, layoutStyle]}
        sections={convertedListData}
        keyExtractor={(item, index) => item + index}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ListHeaderComponent={(generichash && genericListHeader && renderListHeader) || null}
        renderSectionHeader={(generichash && genericsectionHeader && renderSectionHeader) || null}
        refreshControl={refresherEnabled ? <RefreshControl onRefresh={onRefresh} refreshing={refreshing}/> : undefined}
      />
      : <FlatList
        {...innerProps as any}
        style={[{ height, width }, style, layoutStyle]}
        data={convertedListData}
        keyExtractor={(item, index) => item + index}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ListHeaderComponent={(generichash && genericListHeader && renderListHeader) || null}
        refreshControl={refresherEnabled ? <RefreshControl onRefresh={onRefresh} refreshing={refreshing}/> : undefined}
      />
  )
})

export default RecycleView
