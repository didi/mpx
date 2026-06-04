import { forwardRef, useRef, useMemo, createElement, useImperativeHandle, useEffect } from 'react'
import type { ComponentType } from 'react'
import { SectionList, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import type { SectionListData, SectionListProps as RNSectionListProps } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { hasOwn } from '@mpxjs/utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import { extendObject, useLayout, useTransformStyle, GestureHandler, flatGesture } from './utils'
interface ListItem {
  isSectionHeader?: boolean;
  isSectionFooter?: boolean;
  [key: string]: any;
}

interface SectionExtra {
  headerData: ListItem | null;
  footerData: ListItem | null;
  hasSectionHeader?: boolean;
  hasSectionFooter?: boolean;
  headerIndex?: number;
  footerIndex?: number;
}

interface SectionItem {
  itemData: ListItem;
  index: number;
}

interface Section extends SectionExtra {
  data: SectionItem[];
}

type RNSection = SectionListData<SectionItem, SectionExtra>

const TypedSectionList = SectionList as unknown as ComponentType<RNSectionListProps<SectionItem, SectionExtra>>

interface ItemHeightType {
  value?: number;
  getter?: (item: any, index: number) => number;
}

interface ItemExposureDetail {
  index: number;
  itemData: ListItem;
  threshold: number;
}

interface ItemExposureViewToken {
  item: Section | SectionItem;
  key: string;
  index: number | null;
  isViewable: boolean;
  section?: any;
}

interface ItemExposureViewabilityConfig {
  itemVisiblePercentThreshold: number;
}

interface ItemExposureViewabilityPair {
  viewabilityConfig: ItemExposureViewabilityConfig;
  onViewableItemsChanged: (info: {
    viewableItems: ItemExposureViewToken[];
    changed: ItemExposureViewToken[];
  }) => void;
}

interface ItemExposureInfo {
  index: number;
  itemData: ListItem;
}

interface MpxSectionListProps {
  enhanced?: boolean;
  bounces?: boolean;
  height?: number | string;
  width?: number | string;
  generichash?: string;
  style?: Record<string, any>;
  'scroll-event-throttle'?: number;
  'list-data'?: ListItem[];
  'item-height'?: ItemHeightType;
  'section-header-height'?: ItemHeightType;
  'section-footer-height'?: ItemHeightType;
  'list-header-data'?: any;
  'list-header-height'?: number;
  'use-list-header'?: boolean;
  'list-footer-data'?: any;
  'use-list-footer'?: boolean;
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
  'enable-item-exposure'?: boolean;
  'item-exposure-threshold'?: number;
  'wait-for'?: Array<GestureHandler>;
  'simultaneous-handlers'?: Array<GestureHandler>;
  bindrefresherrefresh?: (event: any) => void;
  bindscrolltolower?: (event: any) => void;
  bindscroll?: (event: any) => void;
  binditemexposure?: (event: any) => void;
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
  return global.__mpxGenericsMap?.[generichash]?.[generickey]?.() || null
}

const getExposurePercentThreshold = (threshold = 0) => {
  return Math.max(0, Math.min(100, threshold))
}

const _SectionList = forwardRef<any, MpxSectionListProps>((props = {}, ref) => {
  const {
    enhanced = false,
    bounces = true,
    height,
    width,
    generichash,
    style = {},
    'list-data': listData,
    'scroll-event-throttle': scrollEventThrottle = 0,
    'item-height': itemHeight = {},
    'section-header-height': sectionHeaderHeight = {},
    'section-footer-height': sectionFooterHeight = {},
    'list-header-height': listHeaderHeight = 0,
    'list-header-data': listHeaderData = null,
    'use-list-header': useListHeader = false,
    'list-footer-data': listFooterData = null,
    'use-list-footer': useListFooter = false,
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
    'enable-item-exposure': enableItemExposure = false,
    'item-exposure-threshold': itemExposureThreshold = 0,
    'simultaneous-handlers': originSimultaneousHandlers,
    'wait-for': waitFor,
    binditemexposure
  } = props

  const refreshing = !!refresherTriggered

  const scrollViewRef = useRef<any>(null)
  const sectionListGestureRef = useRef<any>()

  const indexMap = useRef<{ [key: string]: string }>({})

  const reverseIndexMap = useRef<{ [key: string]: number }>({})
  const itemExposureState = useRef<{ [key: string]: boolean }>({})
  const enableItemExposureRef = useRef(false)
  const enableStickyRef = useRef(enableSticky)
  const bindItemExposureRef = useRef<typeof binditemexposure>()
  const propsRef = useRef(props)
  const initialEnableItemExposureRef = useRef(enableItemExposure)
  const itemExposureViewabilityConfig = useRef<ItemExposureViewabilityConfig>()
  if (!itemExposureViewabilityConfig.current) {
    itemExposureViewabilityConfig.current = {
      itemVisiblePercentThreshold: getExposurePercentThreshold(itemExposureThreshold)
    }
  }
  const itemExposureViewabilityConfigValue = itemExposureViewabilityConfig.current as ItemExposureViewabilityConfig

  const {
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: scrollViewRef })

  enableItemExposureRef.current = enableItemExposure
  enableStickyRef.current = enableSticky
  bindItemExposureRef.current = binditemexposure
  propsRef.current = props

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

  const itemExposureViewabilityPairs = useRef<ItemExposureViewabilityPair[]>()
  if (!itemExposureViewabilityPairs.current) {
    itemExposureViewabilityPairs.current = [
      {
        viewabilityConfig: itemExposureViewabilityConfigValue,
        onViewableItemsChanged: ({ changed }) => {
          const bindItemExposure = bindItemExposureRef.current
          if (!enableItemExposureRef.current || !bindItemExposure) return

          const exposedItems: ItemExposureDetail[] = []
          changed.forEach((viewToken) => {
            const exposureInfo = getItemExposureInfo(viewToken)
            if (!exposureInfo) return

            const { index, itemData } = exposureInfo
            const key = `${index}`

            if (!viewToken.isViewable) {
              delete itemExposureState.current[key]
              return
            }

            if (!itemExposureState.current[key]) {
              itemExposureState.current[key] = true
              exposedItems.push({
                index,
                itemData,
                threshold: itemExposureViewabilityConfigValue.itemVisiblePercentThreshold
              })
            }
          })

          if (exposedItems.length) {
            bindItemExposure(
              getCustomEvent('itemexposure', {}, {
                detail: {
                  items: exposedItems,
                  time: Date.now()
                },
                layoutRef
              }, propsRef.current)
            )
          }
        }
      }
    ]
  }

  // 通过sectionIndex和rowIndex获取原始索引
  const getOriginalIndex = (sectionIndex: number, rowIndex: number | 'header' | 'footer'): number => {
    const key = `${sectionIndex}_${rowIndex}`
    return reverseIndexMap.current[key] ?? -1 // 如果找不到，返回-1
  }

  const getItemExposureInfo = (viewToken: ItemExposureViewToken): ItemExposureInfo | null => {
    const item = viewToken.item
    if (!item) return null

    if (viewToken.key.endsWith(':header')) {
      if (enableStickyRef.current) return null
      const section = item as Section
      return section.headerData && section.headerIndex != null
        ? {
            index: section.headerIndex,
            itemData: section.headerData
          }
        : null
    }

    if (viewToken.key.endsWith(':footer')) {
      const section = item as Section
      return section.footerData && section.footerIndex != null
        ? {
            index: section.footerIndex,
            itemData: section.footerData
          }
        : null
    }

    const sectionItem = item as SectionItem
    return {
      index: sectionItem.index,
      itemData: sectionItem.itemData
    }
  }

  const scrollToIndex = ({ index, animated, viewOffset = 0, viewPosition = 0 }: ScrollPositionParams) => {
    if (!scrollViewRef.current) return
    // 通过索引映射表快速定位位置
    const position = indexMap.current[index]
    if (!position) return
    const [sectionIndex, itemIndex] = position.split('_')
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

  const getItemHeight = ({ sectionIndex, rowIndex }: { sectionIndex: number, rowIndex: number }) => {
    if (!itemHeight) {
      return 0
    }
    if ((itemHeight as ItemHeightType).getter) {
      const item = convertedListData[sectionIndex].data[rowIndex]
      // 使用getOriginalIndex获取原始索引
      return (itemHeight as ItemHeightType).getter?.(item.itemData, item.index) || 0
    } else {
      return (itemHeight as ItemHeightType).value || 0
    }
  }

  const getSectionExtraHeight = ({ sectionIndex, type }: { sectionIndex: number, type: 'header' | 'footer' }) => {
    const item = convertedListData[sectionIndex]
    const isHeader = type === 'header'
    if (!(isHeader ? item.hasSectionHeader : item.hasSectionFooter)) return 0
    const sectionExtraHeight = (isHeader ? sectionHeaderHeight : sectionFooterHeight) as ItemHeightType
    if (sectionExtraHeight.getter) {
      const sectionExtraData = isHeader ? item.headerData : item.footerData
      return sectionExtraHeight.getter?.(sectionExtraData, getOriginalIndex(sectionIndex, type)) || 0
    }
    return sectionExtraHeight.value || 0
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
          headerIndex: index
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
            hasSectionFooter: false
          }
        }
        const sectionIndex = sections.length
        currentSection.footerData = item
        currentSection.hasSectionFooter = true
        currentSection.footerIndex = index
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
            hasSectionFooter: false
          }
        }
        // 将 item 添加到当前 section 的 data 中
        const itemIndex = currentSection.data.length
        currentSection.data.push({
          itemData: item,
          index
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
  }, [listData])

  const { getItemLayout } = useMemo(() => {
    const layouts: Array<{ length: number, offset: number, index: number }> = []
    let offset = 0

    if (useListHeader) {
      // 计算列表头部的高度
      offset += listHeaderHeight
    }

    // 遍历所有 sections
    convertedListData.forEach((section: Section, sectionIndex: number) => {
      // 添加 section header 的位置信息
      const headerHeight = getSectionExtraHeight({ sectionIndex, type: 'header' })
      layouts.push({
        length: headerHeight,
        offset,
        index: layouts.length
      })
      offset += headerHeight

      // 添加该 section 中所有 items 的位置信息
      section.data.forEach((item: SectionItem, itemIndex: number) => {
        const contentHeight = getItemHeight({ sectionIndex, rowIndex: itemIndex })
        layouts.push({
          length: contentHeight,
          offset,
          index: layouts.length
        })
        offset += contentHeight
      })

      // 添加该 section 尾部位置信息
      // 因为即使 sectionList 没传 renderSectionFooter，getItemLayout 中的 index 的计算也会包含尾部节点
      const footerHeight = getSectionExtraHeight({ sectionIndex, type: 'footer' })
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
  }, [convertedListData, useListHeader, itemHeight.value, itemHeight.getter, sectionHeaderHeight.value, sectionHeaderHeight.getter, sectionFooterHeight.value, sectionFooterHeight.getter, listHeaderHeight])

  useEffect(() => {
    itemExposureState.current = {}
  }, [convertedListData, enableItemExposure, enableSticky])

  const scrollAdditionalProps = extendObject(
    {
      style: [
        hasOwn(style, 'flex') || hasOwn(style, 'flexGrow') ? null : { flexGrow: 0 },
        { height, width },
        style,
        layoutStyle
      ],
      alwaysBounceVertical: false,
      alwaysBounceHorizontal: false,
      scrollEventThrottle: scrollEventThrottle,
      scrollsToTop: enableBackToTop,
      showsHorizontalScrollIndicator: showScrollbar,
      onEndReachedThreshold,
      ref: scrollViewRef,
      bounces: enhanced ? bounces : false,
      stickySectionHeadersEnabled: enableSticky,
      onScroll: onScroll,
      onEndReached: onEndReached
    },
    refresherEnabled ? { refreshing } : null,
    layoutProps
  )

  if (initialEnableItemExposureRef.current) {
    extendObject(scrollAdditionalProps, {
      viewabilityConfigCallbackPairs: itemExposureViewabilityPairs.current
    })
  }

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

  useImperativeHandle(ref, () => {
    return {
      gestureRef: sectionListGestureRef,
      scrollToIndex
    }
  })

  const innerProps = useInnerProps(extendObject({}, props, scrollAdditionalProps), [
    'id',
    'enhanced',
    'height',
    'width',
    'list-data',
    'item-height',
    'section-header-height',
    'section-footer-height',
    'list-header-height',
    'list-header-data',
    'use-list-header',
    'list-footer-data',
    'use-list-footer',
    'genericrecycle-item',
    'genericsection-header',
    'genericsection-footer',
    'genericlist-header',
    'genericlist-footer',
    'show-scrollbar',
    'lower-threshold',
    'scroll-event-throttle',
    'enable-sticky',
    'enable-back-to-top',
    'end-reached-threshold',
    'refresher-triggered',
    'refresher-enabled',
    'enable-item-exposure',
    'item-exposure-threshold',
    'bindrefresherrefresh',
    'bindscrolltolower',
    'bindscroll',
    'binditemexposure',
    'simultaneous-handlers',
    'wait-for'
  ], { layoutRef })

  // 使用 useMemo 获取 GenericComponent 并创建渲染函数，避免每次组件更新都重新创建函数引用导致不必要的重新渲染
  const renderItem = useMemo(
    () => {
      const ItemComponent = getGeneric(generichash, genericrecycleItem)
      if (!ItemComponent) return undefined
      return ({ item }: { item: SectionItem }) => createElement(ItemComponent, { itemData: item.itemData })
    },
    [generichash, genericrecycleItem]
  )

  const renderSectionHeader = useMemo(
    () => {
      const SectionHeaderComponent = getGeneric(generichash, genericsectionHeader)
      if (!SectionHeaderComponent) return undefined
      return (sectionData: { section: RNSection }) => {
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
      return (sectionData: { section: RNSection }) => {
        if (!sectionData.section.hasSectionFooter) return null
        return createElement(SectionFooterComponent, { itemData: sectionData.section.footerData })
      }
    },
    [generichash, genericsectionFooter]
  )

  const ListHeaderGenericComponent = useMemo(
    () => {
      if (!useListHeader) return null
      return getGeneric(generichash, genericListHeader)
    },
    [useListHeader, generichash, genericListHeader]
  )

  const ListFooterGenericComponent = useMemo(
    () => {
      if (!useListFooter) return null
      return getGeneric(generichash, genericListFooter)
    },
    [useListFooter, generichash, genericListFooter]
  )

  const ListHeaderComponent = useMemo(
    () => {
      if (!ListHeaderGenericComponent) return null
      return createElement(ListHeaderGenericComponent, { listHeaderData })
    },
    [ListHeaderGenericComponent, listHeaderData]
  )

  const ListFooterComponent = useMemo(
    () => {
      if (!ListFooterGenericComponent) return null
      return createElement(ListFooterGenericComponent, { listFooterData })
    },
    [ListFooterGenericComponent, listFooterData]
  )

  const sectionListProps: RNSectionListProps<SectionItem, SectionExtra> = extendObject(
    {
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

  return createElement(
    GestureDetector,
    { gesture: nativeGesture },
    createElement(
      TypedSectionList,
      sectionListProps
    )
  )
})

_SectionList.displayName = 'MpxSectionList'

export default _SectionList
