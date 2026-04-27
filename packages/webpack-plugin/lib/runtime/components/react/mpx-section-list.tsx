import { forwardRef, useRef, useState, useEffect, useMemo, createElement, useImperativeHandle, memo } from 'react'
import { SectionList, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import { extendObject, useLayout, useTransformStyle, GestureHandler, flatGesture } from './utils'
interface ListItem {
  isSectionHeader?: boolean;
  isSectionFooter?: boolean;
  _originalItemIndex?: number;
  [key: string]: any;
}

interface Section {
  headerData: ListItem | null;
  footerData: ListItem | null;
  data: ListItem[];
  hasSectionHeader?: boolean;
  hasSectionFooter?: boolean;
  _originalItemIndex?: number;
}

interface ItemHeightType {
  value?: number;
  getter?: (item: any, index: number) => number;
}

interface SectionListProps {
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
  sectionFooterHeight?: ItemHeightType;
  listHeaderData?: any;
  listHeaderHeight?: ItemHeightType;
  useListHeader?: boolean;
  listFooterData?: any;
  useListFooter?: boolean;
  'genericrecycle-item'?: string;
  'genericsection-header'?: string;
  'genericsection-footer'?: string;
  'genericlist-header'?: string;
  'genericlist-footer'?: string;
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
  'wait-for'?: Array<GestureHandler>;
  'simultaneous-handlers'?: Array<GestureHandler>;
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

  return memo(forwardRef((props: any, ref: any) => {
    return createElement(GenericComponent, extendObject({}, {
      ref: ref
    }, props))
  }))
}

const _SectionList = forwardRef<any, SectionListProps>((props = {}, ref) => {
  const {
    enhanced = false,
    bounces = true,
    scrollEventThrottle = 0,
    height,
    width,
    listData,
    generichash,
    style = {},
    itemHeight = {},
    sectionHeaderHeight = {},
    sectionFooterHeight = {},
    listHeaderHeight = {},
    listHeaderData = null,
    useListHeader = false,
    listFooterData = null,
    useListFooter = false,
    'genericrecycle-item': genericrecycleItem,
    'genericsection-header': genericsectionHeader,
    'genericsection-footer': genericsectionFooter,
    'genericlist-header': genericListHeader,
    'genericlist-footer': genericListFooter,
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
    'refresher-triggered': refresherTriggered,
    'simultaneous-handlers': originSimultaneousHandlers,
    'wait-for': waitFor
  } = props

  const [refreshing, setRefreshing] = useState(!!refresherTriggered)

  const scrollViewRef = useRef<any>(null)
  const sectionListGestureRef = useRef<any>()

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
  const getOriginalIndex = (sectionIndex: number, rowIndex: number | 'header' | 'footer'): number => {
    const key = `${sectionIndex}_${rowIndex}`
    return reverseIndexMap.current[key] ?? -1 // 如果找不到，返回-1
  }

  const scrollToIndex = ({ index, animated, viewOffset = 0, viewPosition = 0 }: ScrollPositionParams) => {
    if (scrollViewRef.current) {
      // 通过索引映射表快速定位位置
      const position = indexMap.current[index]
      const [sectionIndex, itemIndex] = (position as string).split('_')
      const targetSectionIndex = Number(sectionIndex) || 0
      const targetItemIndex = itemIndex === 'header'
        ? 0
        : itemIndex === 'footer'
          ? convertedListData[targetSectionIndex].data.length + 1
          : Number(itemIndex) + 1
      scrollViewRef.current.scrollToLocation?.({
        itemIndex: targetItemIndex,
        sectionIndex: targetSectionIndex,
        animated,
        viewOffset,
        viewPosition
      })
    }
  }

  const getItemHeight = ({ sectionIndex, rowIndex }: { sectionIndex: number, rowIndex: number }) => {
    if (!itemHeight) {
      return 0
    }
    if ((itemHeight as ItemHeightType).getter) {
      const item = convertedListData[sectionIndex].data[rowIndex]
      // 使用getOriginalIndex获取原始索引
      const originalIndex = getOriginalIndex(sectionIndex, rowIndex)
      return (itemHeight as ItemHeightType).getter?.(item, originalIndex) || 0
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

  const getSectionFooterHeight = ({ sectionIndex }: { sectionIndex: number }) => {
    const item = convertedListData[sectionIndex]
    const { hasSectionFooter } = item
    // 使用getOriginalIndex获取原始索引
    const originalIndex = getOriginalIndex(sectionIndex, 'footer')
    if (!hasSectionFooter) return 0
    if ((sectionFooterHeight as ItemHeightType).getter) {
      return (sectionFooterHeight as ItemHeightType).getter?.(item, originalIndex) || 0
    } else {
      return (sectionFooterHeight as ItemHeightType).value || 0
    }
  }

  const convertedListData = useMemo(() => {
    const sections: Section[] = []
    let currentSection: Section | null = null
    // 清空之前的索引映射
    indexMap.current = {}
    // 清空反向索引映射
    reverseIndexMap.current = {}

    // 处理 listData 为空的情况
    if (!listData || !listData.length) {
      return sections
    }

    listData.forEach((item: ListItem, index: number) => {
      if (item.isSectionHeader) {
        // 如果已经存在一个 section，先把它添加到 sections 中
        if (currentSection) {
          sections.push(currentSection)
        }
        // 创建新的 section
        currentSection = {
          headerData: item,
          footerData: null,
          data: [],
          hasSectionHeader: true,
          hasSectionFooter: false,
          _originalItemIndex: index
        }
        // 为 section header 添加索引映射
        const sectionIndex = sections.length
        indexMap.current[index] = `${sectionIndex}_header`
        // 添加反向索引映射
        reverseIndexMap.current[`${sectionIndex}_header`] = index
      } else if (item.isSectionFooter) {
        // 如果没有当前 section，创建一个默认的
        if (!currentSection) {
          // 创建默认section (无header的section)
          currentSection = {
            headerData: null,
            footerData: null,
            data: [],
            hasSectionHeader: false,
            hasSectionFooter: false,
            _originalItemIndex: -1
          }
        }
        const sectionIndex = sections.length
        currentSection.footerData = item
        currentSection.hasSectionFooter = true
        indexMap.current[index] = `${sectionIndex}_footer`
        // 添加反向索引映射
        reverseIndexMap.current[`${sectionIndex}_footer`] = index
        sections.push(currentSection)
        currentSection = null
      } else {
        // 如果没有当前 section，创建一个默认的
        if (!currentSection) {
          // 创建默认section (无header的section)
          currentSection = {
            headerData: null,
            footerData: null,
            data: [],
            hasSectionHeader: false,
            hasSectionFooter: false,
            _originalItemIndex: -1
          }
        }
        // 将 item 添加到当前 section 的 data 中
        const itemIndex = currentSection.data.length
        currentSection.data.push(extendObject({}, item, {
          _originalItemIndex: index
        }))
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
  }, [listData])

  const { getItemLayout } = useMemo(() => {
    const layouts: Array<{ length: number, offset: number, index: number }> = []
    let offset = 0

    if (useListHeader) {
      // 计算列表头部的高度
      offset += listHeaderHeight.getter?.() || listHeaderHeight.value || 0
    }

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
      const footerHeight = getSectionFooterHeight({ sectionIndex })
      layouts.push({
        length: footerHeight,
        offset,
        index: layouts.length
      })
      offset += footerHeight
    })
    return {
      itemLayouts: layouts,
      getItemLayout: (data: any, index: number) => layouts[index]
    }
  }, [convertedListData, useListHeader, itemHeight.value, itemHeight.getter, sectionHeaderHeight.value, sectionHeaderHeight.getter, sectionFooterHeight.value, sectionFooterHeight.getter, listHeaderHeight.value, listHeaderHeight.getter])

  const scrollAdditionalProps = extendObject(
    {
      alwaysBounceVertical: false,
      alwaysBounceHorizontal: false,
      scrollEventThrottle: scrollEventThrottle,
      scrollsToTop: enableBackToTop,
      showsHorizontalScrollIndicator: showScrollbar,
      onEndReachedThreshold,
      ref: scrollViewRef,
      bounces: false,
      stickySectionHeadersEnabled: enableSticky,
      onScroll: onScroll,
      onEndReached: onEndReached
    },
    layoutProps
  )

  const nativeGesture = useMemo(() => {
    const simultaneousHandlers = flatGesture(originSimultaneousHandlers)
    const waitForHandlers = flatGesture(waitFor)
    const gesture = Gesture.Native().withRef(sectionListGestureRef as any)
    if (simultaneousHandlers && simultaneousHandlers.length) {
      gesture.simultaneousWithExternalGesture(...simultaneousHandlers)
    }
    if (waitForHandlers && waitForHandlers.length) {
      gesture.requireExternalGestureToFail(...waitForHandlers)
    }
    return gesture
  }, [originSimultaneousHandlers, waitFor])

  if (enhanced) {
    extendObject(scrollAdditionalProps, {
      bounces
    })
  }
  if (refresherEnabled) {
    extendObject(scrollAdditionalProps, {
      refreshing: refreshing
    })
  }

  useImperativeHandle(ref, () => {
    return extendObject({}, props, {
      gestureRef: sectionListGestureRef,
      scrollToIndex
    })
  })

  const innerProps = useInnerProps(extendObject({}, props, scrollAdditionalProps), [
    'id',
    'show-scrollbar',
    'lower-threshold',
    'refresher-triggered',
    'refresher-enabled',
    'bindrefresherrefresh',
    'simultaneous-handlers',
    'wait-for'
  ], { layoutRef })

  // 使用 ref 保存最新的数据，避免数据变化时组件销毁重建
  const listHeaderDataRef = useRef(listHeaderData)
  listHeaderDataRef.current = listHeaderData

  const listFooterDataRef = useRef(listFooterData)
  listFooterDataRef.current = listFooterData

  // 使用 useMemo 获取 GenericComponent 并创建渲染函数，避免每次组件更新都重新创建函数引用导致不必要的重新渲染
  const renderItem = useMemo(
    () => {
      const ItemComponent = getGeneric(generichash, genericrecycleItem)
      if (!ItemComponent) return undefined
      return ({ item }: { item: any }) => createElement(ItemComponent, { itemData: item })
    },
    [generichash, genericrecycleItem]
  )

  const renderSectionHeader = useMemo(
    () => {
      const SectionHeaderComponent = getGeneric(generichash, genericsectionHeader)
      if (!SectionHeaderComponent) return undefined
      return (sectionData: { section: Section }) => {
        if (!sectionData.section.hasSectionHeader) return null
        return createElement(SectionHeaderComponent, { itemData: sectionData.section.headerData })
      }
    },
    [generichash, genericsectionHeader]
  )

  const renderSectionFooter = useMemo(
    () => {
      const SectionFooterComponent = getGeneric(generichash, genericsectionFooter)
      if (!SectionFooterComponent) return undefined
      return (sectionData: { section: Section }) => {
        if (!sectionData.section.hasSectionFooter) return null
        return createElement(SectionFooterComponent, { itemData: sectionData.section.footerData })
      }
    },
    [generichash, genericsectionFooter]
  )

  const ListHeaderComponent = useMemo(
    () => {
      if (!useListHeader) return null
      const ListHeaderGenericComponent = getGeneric(generichash, genericListHeader)
      if (!ListHeaderGenericComponent) return null
      return () => createElement(ListHeaderGenericComponent, { listHeaderData: listHeaderDataRef.current })
    },
    [useListHeader, generichash, genericListHeader]
  )

  const ListFooterComponent = useMemo(
    () => {
      if (!useListFooter) return null
      const ListFooterGenericComponent = getGeneric(generichash, genericListFooter)
      if (!ListFooterGenericComponent) return null
      return () => createElement(ListFooterGenericComponent, { listFooterData: listFooterDataRef.current })
    },
    [useListFooter, generichash, genericListFooter]
  )

  return createElement(
    GestureDetector,
    { gesture: nativeGesture },
    createElement(
      SectionList,
      extendObject(
        {
          style: [{ height, width }, style, layoutStyle],
          sections: convertedListData,
          renderItem: renderItem,
          getItemLayout: getItemLayout,
          ListHeaderComponent: useListHeader ? ListHeaderComponent : null,
          ListFooterComponent: useListFooter ? ListFooterComponent : null,
          renderSectionHeader: renderSectionHeader,
          renderSectionFooter: renderSectionFooter,
          refreshControl: refresherEnabled
            ? createElement(RefreshControl, {
              onRefresh: onRefresh,
              refreshing: refreshing
            })
            : undefined
        },
        innerProps
      )
    )
  )
})

_SectionList.displayName = 'MpxSectionList'

export default _SectionList
