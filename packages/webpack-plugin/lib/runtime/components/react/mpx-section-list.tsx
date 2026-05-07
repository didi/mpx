
import { forwardRef, useRef, useState, useEffect, useMemo, useLayoutEffect, createElement, useImperativeHandle, useCallback, memo, useContext } from 'react'
import { SectionList, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import { extendObject, useLayout, useTransformStyle, GestureHandler, flatGesture, useNavigation } from './utils'
import { IntersectionObserverContext } from './context'
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
  listFooterHeight?: ItemHeightType;
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
  'enable-trigger-intersection-observer'?: boolean;
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

interface LayoutItem {
  length: number;
  offset: number;
  index: number;
}

interface VirtualTarget {
  id: string;
  itemData: any;
  length: number;
  offset: number;
  type: 'header' | 'footer' | 'item' | 'list-header' | 'list-footer';
  nextHeaderOffset?: number;
}

interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
  id?: string;
}

interface SectionListIntersectionObserverOptions {
  enabled: boolean;
  scrollViewRef: any;
  itemLayouts: LayoutItem[];
  itemLayoutsRef: any;
  virtualTargetMap: Map<any, VirtualTarget>;
  virtualTargetIdMap: Map<string, VirtualTarget>;
  listHeaderTarget: VirtualTarget | null;
  listFooterTarget: VirtualTarget | null;
  enableSticky: boolean;
}

const VirtualMeasureContextsKey = '__mpxVirtualIntersectionObserverMeasureContexts'
const emptyVirtualTargetMap = new Map<any, VirtualTarget>()
const emptyVirtualTargetIdMap = new Map<string, VirtualTarget>()

const getVisibleRangeByLayouts = (layouts: LayoutItem[] = [], scrollTop = 0, viewportHeight = 0) => {
  if (!layouts.length || viewportHeight <= 0) {
    return {
      start: -1,
      end: -1
    }
  }
  const viewportBottom = scrollTop + viewportHeight
  let start = -1
  let end = -1
  for (let i = 0; i < layouts.length; i++) {
    const item = layouts[i]
    const itemTop = item.offset
    const itemBottom = item.offset + item.length
    if (itemBottom >= scrollTop && itemTop <= viewportBottom) {
      if (start < 0) start = i
      end = i
    } else if (itemTop > viewportBottom && end >= 0) {
      break
    }
  }
  return {
    start,
    end
  }
}

const getViewableOriginalIndexes = (viewableItems: any[] = []) => {
  const indexes: number[] = []
  viewableItems.forEach((viewableItem) => {
    const originalIndex = viewableItem?.item?._originalItemIndex
    if (typeof originalIndex === 'number') {
      indexes.push(originalIndex)
    }
  })
  indexes.sort((a, b) => a - b)
  return indexes
}

const restrictValueInRange = (start = 0, end = 0, value = 0) => {
  return Math.min(Math.max(start, value), end)
}

const getRectIntersection = (baseRect: Rect, clipRect: Rect) => {
  const left = restrictValueInRange(clipRect.left, clipRect.right, baseRect.left)
  const top = restrictValueInRange(clipRect.top, clipRect.bottom, baseRect.top)
  const right = restrictValueInRange(clipRect.left, clipRect.right, baseRect.right)
  const bottom = restrictValueInRange(clipRect.top, clipRect.bottom, baseRect.bottom)
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top
  }
}

const getVirtualMeasureContexts = (intersectionObservers: any) => {
  if (!intersectionObservers[VirtualMeasureContextsKey]) {
    Object.defineProperty(intersectionObservers, VirtualMeasureContextsKey, {
      value: new Map(),
      configurable: true
    })
  }
  return intersectionObservers[VirtualMeasureContextsKey]
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

const useSectionListIntersectionObserver = ({
  enabled,
  scrollViewRef,
  itemLayouts,
  itemLayoutsRef,
  virtualTargetMap,
  virtualTargetIdMap,
  listHeaderTarget,
  listFooterTarget,
  enableSticky
}: SectionListIntersectionObserverOptions) => {
  const intersectionObservers = useContext(IntersectionObserverContext)
  const navigation = useNavigation()
  const viewportRectRef = useRef<Rect | null>(null)
  const measureContextRef = useRef<any>(null)
  const virtualMeasureContextIdRef = useRef({})
  const enabledRef = useRef(enabled)
  const stateRef = useRef({
    scrollTop: 0,
    viewportHeight: 0,
    visibleRangeStart: -1,
    visibleRangeEnd: -1,
    viewableSignature: ''
  })

  const getPayload = useCallback((payload = {}) => {
    const { scrollTop, viewportHeight, visibleRangeStart, visibleRangeEnd, viewableSignature } = stateRef.current
    return Object.assign({
      signature: `${scrollTop}_${viewportHeight}_${visibleRangeStart}_${visibleRangeEnd}_${viewableSignature}`,
      scrollTop,
      viewportHeight,
      visibleRangeStart,
      visibleRangeEnd
    }, payload)
  }, [])

  const triggerWithPayload = useCallback((payload = {}) => {
    if (!enabled || !intersectionObservers) return
    const measurePayload = measureContextRef.current
      ? Object.assign({ measureContext: measureContextRef.current }, payload)
      : payload
    for (const key in intersectionObservers) {
      const observer = intersectionObservers[key]
      if (!observer) continue
      if (observer.throttleMeasureBySource) {
        observer.throttleMeasureBySource('section-list', measurePayload)
      } else {
        observer.throttleMeasure(measureContextRef.current)
      }
    }
  }, [enabled, intersectionObservers])

  const triggerIntersectionObserver = useCallback((payload = {}) => {
    triggerWithPayload(getPayload(payload))
  }, [triggerWithPayload, getPayload])

  const updateViewportRect = useCallback(() => {
    if (!enabled) return
    const node = scrollViewRef.current
    if (node?.measureInWindow) {
      node.measureInWindow((x: number, y: number, viewportWidth: number, viewportHeight: number) => {
        const statusBarHeight = navigation?.layout?.statusBarHeight || 0
        const top = y + statusBarHeight
        viewportRectRef.current = {
          left: x,
          top,
          right: x + viewportWidth,
          bottom: top + viewportHeight,
          width: viewportWidth,
          height: viewportHeight
        }
        triggerIntersectionObserver({
          force: true
        })
      })
    }
  }, [enabled, scrollViewRef, navigation, triggerIntersectionObserver])

  const updateScrollState = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!enabled) return
    const contentOffset = event.nativeEvent && event.nativeEvent.contentOffset
    const layoutMeasurement = event.nativeEvent && event.nativeEvent.layoutMeasurement
    const scrollTop = contentOffset?.y || 0
    const viewportHeight = layoutMeasurement?.height || stateRef.current.viewportHeight
    const visibleRange = getVisibleRangeByLayouts(itemLayoutsRef.current, scrollTop, viewportHeight)
    Object.assign(stateRef.current, {
      scrollTop,
      viewportHeight,
      visibleRangeStart: visibleRange.start,
      visibleRangeEnd: visibleRange.end
    })
    if (layoutMeasurement && viewportRectRef.current) {
      const { width: viewportWidth, height: viewportHeight } = layoutMeasurement
      viewportRectRef.current.width = viewportWidth
      viewportRectRef.current.height = viewportHeight
      viewportRectRef.current.right = viewportRectRef.current.left + viewportWidth
      viewportRectRef.current.bottom = viewportRectRef.current.top + viewportHeight
    }
    triggerIntersectionObserver()
  }, [enabled, itemLayoutsRef, triggerIntersectionObserver])

  const updateViewableSignature = useCallback((viewableItems: any[] = []) => {
    if (!enabled) return
    stateRef.current.viewableSignature = getViewableOriginalIndexes(viewableItems).join(',')
    triggerIntersectionObserver()
  }, [enabled, triggerIntersectionObserver])

  const getVirtualRect = useCallback((target: VirtualTarget): Rect | null => {
    const viewportRect = viewportRectRef.current
    if (!viewportRect) return null
    const scrollOffset = stateRef.current.scrollTop || 0
    let top = viewportRect.top + target.offset - scrollOffset
    if (enableSticky && target.type === 'header' && target.length) {
      const stickyTop = Math.max(top, viewportRect.top)
      top = typeof target.nextHeaderOffset === 'number'
        ? Math.min(stickyTop, viewportRect.top + target.nextHeaderOffset - scrollOffset - target.length)
        : stickyTop
    }
    const bottom = top + target.length
    return {
      id: target.id,
      left: viewportRect.left,
      top,
      right: viewportRect.right,
      bottom,
      width: viewportRect.width,
      height: target.length
    }
  }, [enableSticky])

  const measureContext = useMemo(() => {
    if (!enabled) return null
    const getVirtualTarget = (observer: any, selector = '', allowSelector = true) => {
      const componentProps = observer?.component?.__props || {}
      const target = componentProps.itemData !== undefined
        ? virtualTargetMap.get(componentProps.itemData)
        : null
      if (target) return target
      if (componentProps.listHeaderData !== undefined) return listHeaderTarget
      if (componentProps.listFooterData !== undefined) return listFooterTarget
      if (!allowSelector) return null
      const selectorId = selector && selector.charAt(0) === '#' ? selector.slice(1) : ''
      return virtualTargetIdMap.get(selectorId)
    }
    const shouldUseRealMeasure = (observerRefs: any[] = []) => {
      return observerRefs.some((ref) => {
        const props = ref?.getNodeInstance?.().props?.current || {}
        const dataset = props.dataset || {}
        return !!(dataset.mpxSectionListObserveReal || props['data-mpx-section-list-observe-real'])
      })
    }
    return {
      isObserveTarget ({ observer, observerRefs }: { observer: any, observerRefs: any[] }) {
        return !!getVirtualTarget(observer, '', false) && !shouldUseRealMeasure(observerRefs)
      },
      getObserveRects ({ observer, observerRefs, selector }: { observer: any, observerRefs: any[], selector: string }) {
        if (shouldUseRealMeasure(observerRefs)) return null
        const target = getVirtualTarget(observer, selector)
        const rect = target && getVirtualRect(target)
        if (target && !rect) return []
        if (!rect) return null
        const refsCount = observerRefs?.length || 1
        const rects = []
        for (let i = 0; i < refsCount; i++) {
          rects.push(extendObject({}, rect))
        }
        return rects
      },
      getRelativeRect ({ observer, relativeRef }: { observer: any, relativeRef: any }) {
        const viewportRect = viewportRectRef.current
        if (relativeRef !== 'window' || !viewportRect || typeof observer?._getWindowRect !== 'function') {
          return null
        }
        return getRectIntersection(observer._getWindowRect(), viewportRect)
      }
    }
  }, [enabled, virtualTargetMap, virtualTargetIdMap, listHeaderTarget, listFooterTarget, getVirtualRect])

  measureContextRef.current = measureContext

  useLayoutEffect(() => {
    if (!enabled || !intersectionObservers || !measureContext) return
    const virtualMeasureContexts = getVirtualMeasureContexts(intersectionObservers)
    const contextId = virtualMeasureContextIdRef.current
    virtualMeasureContexts.set(contextId, measureContext)
    triggerIntersectionObserver({
      force: true
    })
    return () => {
      virtualMeasureContexts.delete(contextId)
    }
  }, [enabled, intersectionObservers, measureContext, triggerIntersectionObserver])

  useLayoutEffect(() => {
    const wasEnabled = enabledRef.current
    enabledRef.current = enabled
    if (enabled && !wasEnabled) {
      updateViewportRect()
    }
  }, [enabled, updateViewportRect])

  useEffect(() => {
    if (!enabled) return
    const { scrollTop, viewportHeight } = stateRef.current
    const visibleRange = getVisibleRangeByLayouts(itemLayouts, scrollTop, viewportHeight)
    Object.assign(stateRef.current, {
      visibleRangeStart: visibleRange.start,
      visibleRangeEnd: visibleRange.end
    })
    triggerIntersectionObserver({
      force: true,
      forceInit: true
    })
  }, [enabled, itemLayouts, triggerIntersectionObserver])

  return {
    updateViewportRect: enabled ? updateViewportRect : undefined,
    updateScrollState,
    updateViewableSignature,
    triggerIntersectionObserver
  }
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
    listFooterHeight = {},
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
    'enable-trigger-intersection-observer': enableTriggerIntersectionObserver = false,
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
  const itemLayoutsRef = useRef<LayoutItem[]>([])
  const sectionListGestureRef = useRef<any>()

  const indexMap = useRef<{ [key: string]: string | number }>({})

  const reverseIndexMap = useRef<{ [key: string]: number }>({})

  const {
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  useEffect(() => {
    if (refreshing !== refresherTriggered) {
      setRefreshing(!!refresherTriggered)
    }
  }, [refresherTriggered])

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

  const getListFooterHeight = () => {
    if (!useListFooter) return 0
    const footerHeightGetter = (listFooterHeight as ItemHeightType).getter
    if (footerHeightGetter) {
      return footerHeightGetter(listFooterData, -1) || 0
    }
    const footerHeight = (listFooterHeight as ItemHeightType).value
    return typeof footerHeight === 'number'
      ? footerHeight
      : 0
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

  const { getItemLayout, itemLayouts, virtualTargetMap, virtualTargetIdMap, listHeaderTarget, listFooterTarget } = useMemo(() => {
    const layouts: Array<{ length: number, offset: number, index: number }> = []
    const shouldBuildVirtualTargets = enableTriggerIntersectionObserver
    const targetMap = shouldBuildVirtualTargets ? new Map<any, VirtualTarget>() : emptyVirtualTargetMap
    const targetIdMap = shouldBuildVirtualTargets ? new Map<string, VirtualTarget>() : emptyVirtualTargetIdMap
    const headerTargets: VirtualTarget[] = []
    let listHeaderTarget: VirtualTarget | null = null
    let listFooterTarget: VirtualTarget | null = null
    let offset = 0

    if (useListHeader) {
      // 计算列表头部的高度
      const headerHeight = listHeaderHeight.getter?.() || listHeaderHeight.value || 0
      if (shouldBuildVirtualTargets) {
        const target = {
          id: 'mpx-recycle-list-header',
          itemData: listHeaderData,
          length: headerHeight,
          offset,
          type: 'list-header' as const
        }
        listHeaderTarget = target
        if (listHeaderData != null) {
          targetMap.set(listHeaderData, target)
        }
        targetIdMap.set(target.id, target)
      }
      offset += headerHeight
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
      if (shouldBuildVirtualTargets && section.headerData) {
        const headerOriginalIndex = getOriginalIndex(sectionIndex, 'header')
        const target = {
          id: `mpx-recycle-item-${headerOriginalIndex}`,
          itemData: section.headerData,
          length: headerHeight,
          offset,
          type: 'header' as const
        }
        targetMap.set(section.headerData, target)
        targetIdMap.set(target.id, target)
        headerTargets.push(target)
      }
      offset += headerHeight

      // 添加该 section 中所有 items 的位置信息
      section.data.forEach((item: ListItem, itemIndex: number) => {
        const contenteight = getItemHeight({ sectionIndex, rowIndex: itemIndex })
        layouts.push({
          length: contenteight,
          offset,
          index: layouts.length
        })
        if (shouldBuildVirtualTargets) {
          const originalIndex = getOriginalIndex(sectionIndex, itemIndex)
          const target = {
            id: `mpx-recycle-item-${originalIndex}`,
            itemData: item,
            length: contenteight,
            offset,
            type: 'item' as const
          }
          targetMap.set(item, target)
          targetIdMap.set(target.id, target)
        }
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
      if (shouldBuildVirtualTargets && section.footerData) {
        const footerOriginalIndex = getOriginalIndex(sectionIndex, 'footer')
        const target = {
          id: `mpx-recycle-item-${footerOriginalIndex}`,
          itemData: section.footerData,
          length: footerHeight,
          offset,
          type: 'footer' as const
        }
        targetMap.set(section.footerData, target)
        targetIdMap.set(target.id, target)
      }
      offset += footerHeight
    })
    if (shouldBuildVirtualTargets) {
      headerTargets.forEach((target, index) => {
        const nextHeader = headerTargets[index + 1]
        if (nextHeader) {
          target.nextHeaderOffset = nextHeader.offset
        }
      })
    }
    if (shouldBuildVirtualTargets && useListFooter) {
      const footerHeight = getListFooterHeight()
      const target = {
        id: 'mpx-recycle-list-footer',
        itemData: listFooterData,
        length: footerHeight,
        offset,
        type: 'list-footer' as const
      }
      listFooterTarget = target
      targetIdMap.set(target.id, target)
    }
    return {
      itemLayouts: layouts,
      getItemLayout: (data: any, index: number) => layouts[index],
      virtualTargetMap: targetMap,
      virtualTargetIdMap: targetIdMap,
      listHeaderTarget,
      listFooterTarget
    }
  }, [convertedListData, enableTriggerIntersectionObserver, useListHeader, listHeaderData, useListFooter, listFooterData, itemHeight.value, itemHeight.getter, sectionHeaderHeight.value, sectionHeaderHeight.getter, sectionFooterHeight.value, sectionFooterHeight.getter, listHeaderHeight.value, listHeaderHeight.getter, listFooterHeight.value, listFooterHeight.getter])

  itemLayoutsRef.current = itemLayouts

  const {
    updateViewportRect,
    updateScrollState,
    updateViewableSignature,
    triggerIntersectionObserver
  } = useSectionListIntersectionObserver({
    enabled: enableTriggerIntersectionObserver,
    scrollViewRef,
    itemLayouts,
    itemLayoutsRef,
    virtualTargetMap,
    virtualTargetIdMap,
    listHeaderTarget,
    listFooterTarget,
    enableSticky
  })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: scrollViewRef, onLayout: updateViewportRect })

  const updateViewableSignatureRef = useRef(updateViewableSignature)
  updateViewableSignatureRef.current = updateViewableSignature

  const originOnViewableItemsChangedRef = useRef(props.onViewableItemsChanged)
  originOnViewableItemsChangedRef.current = props.onViewableItemsChanged

  const onViewableItemsChangedRef = useRef((event: any) => {
    updateViewableSignatureRef.current(event?.viewableItems)
    const originOnViewableItemsChanged = originOnViewableItemsChangedRef.current
    if (typeof originOnViewableItemsChanged === 'function') {
      originOnViewableItemsChanged(event)
    }
  })

  const onViewableItemsChanged = onViewableItemsChangedRef.current

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
    triggerIntersectionObserver({
      force: true
    })
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { bindscroll } = props
    bindscroll &&
      bindscroll(
        getCustomEvent('scroll', event.nativeEvent, { layoutRef }, props)
      )
    updateScrollState(event)
  }

  const onScrollEndDrag = () => {
    triggerIntersectionObserver({
      force: true
    })
  }

  const onMomentumScrollEnd = () => {
    triggerIntersectionObserver({
      force: true
    })
  }

  const shouldHandleScroll = enableTriggerIntersectionObserver || typeof props.bindscroll === 'function'
  const shouldHandleEndReached = enableTriggerIntersectionObserver || typeof props.bindscrolltolower === 'function'
  const shouldHandleViewableItemsChanged = enableTriggerIntersectionObserver || typeof props.onViewableItemsChanged === 'function'

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
      onScroll: shouldHandleScroll ? onScroll : undefined,
      onEndReached: shouldHandleEndReached ? onEndReached : undefined,
      onScrollEndDrag: enableTriggerIntersectionObserver ? onScrollEndDrag : undefined,
      onMomentumScrollEnd: enableTriggerIntersectionObserver ? onMomentumScrollEnd : undefined,
      onViewableItemsChanged: shouldHandleViewableItemsChanged ? onViewableItemsChanged : undefined
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
    'enable-trigger-intersection-observer',
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
