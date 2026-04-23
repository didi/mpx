import { forwardRef, useRef, useState, useEffect, useMemo, createElement, useImperativeHandle, memo } from 'react'
import { SectionList, RefreshControl, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useSharedValue, withTiming, useAnimatedStyle, runOnJS } from 'react-native-reanimated'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import { extendObject, useLayout, useTransformStyle, GestureHandler, flatGesture, HIDDEN_STYLE, useRunOnJSCallback } from './utils'
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
  listHeaderData?: any;
  listHeaderHeight?: ItemHeightType;
  useListHeader?: boolean;
  listFooterData?: any;
  useListFooter?: boolean;
  'genericrecycle-item'?: string;
  'genericsection-header'?: string;
  'genericlist-header'?: string;
  'genericlist-footer'?: string;
  'genericrefresher'?: string;
  'enable-var'?: boolean;
  'external-var-context'?: any;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  'enable-sticky'?: boolean;
  'enable-back-to-top'?: boolean;
  'end-reached-threshold'?: number;
  'refresher-enabled'?: boolean;
  'refresher-default-style'?: 'black' | 'white' | 'none';
  'refresher-background'?: string;
  'refresher-threshold'?: number;
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

const REFRESH_COLOR = {
  black: ['#000'],
  white: ['#fff']
}

const getRefresherColor = (refresherDefaultStyle: any) => {
  if (refresherDefaultStyle === 'black') {
    return { colors: REFRESH_COLOR.black }
  }
  if (refresherDefaultStyle === 'white') {
    return { colors: REFRESH_COLOR.white }
  }
  return {}
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
    listHeaderHeight = {},
    listHeaderData = null,
    useListHeader = false,
    listFooterData = null,
    useListFooter = false,
    'genericrecycle-item': genericrecycleItem,
    'genericsection-header': genericsectionHeader,
    'genericlist-header': genericListHeader,
    'genericlist-footer': genericListFooter,
    genericrefresher: genericRefresher,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    'enable-sticky': enableSticky = false,
    'enable-back-to-top': enableBackToTop = false,
    'end-reached-threshold': onEndReachedThreshold = 0.1,
    'refresher-enabled': refresherEnabled,
    'refresher-default-style': refresherDefaultStyle,
    'refresher-background': refresherBackground,
    'refresher-threshold': refresherThreshold = 45,
    'show-scrollbar': showScrollbar = true,
    'refresher-triggered': refresherTriggered,
    'simultaneous-handlers': originSimultaneousHandlers,
    'wait-for': waitFor
  } = props

  const RefresherComponent = useMemo(() => getGeneric(generichash, genericRefresher), [generichash, genericRefresher])
  const hasRefresher = !!(RefresherComponent && refresherEnabled)

  const [refreshing, setRefreshing] = useState(!!refresherTriggered)
  const [enableScroll, setEnableScroll] = useState(true)
  const [scrollBounces, setScrollBounces] = useState(false)

  const enableScrollValue = useSharedValue(true)
  const bouncesValue = useSharedValue(false)
  const translateY = useSharedValue(0)
  const isAtTop = useSharedValue(true)
  const refresherHeight = useSharedValue(0)

  const scrollViewRef = useRef<any>(null)
  const sectionListGestureRef = useRef<any>()
  const hasRefresherLayoutRef = useRef(false)
  const refresherLayoutStyle = useMemo(() => { return !hasRefresherLayoutRef.current ? HIDDEN_STYLE : {} }, [hasRefresherLayoutRef.current])

  const propsRef = useRef(props)
  const refresherStateRef = useRef({
    hasRefresher,
    refresherTriggered
  })

  propsRef.current = props
  refresherStateRef.current = {
    hasRefresher,
    refresherTriggered
  }

  const runOnJSCallbackRef = useRef({
    setEnableScroll,
    setScrollBounces,
    setRefreshing,
    onRefresh
  })
  const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef)

  const indexMap = useRef<{ [key: string]: string | number }>({})

  const reverseIndexMap = useRef<{ [key: string]: number }>({})

  const {
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: scrollViewRef })

  useEffect(() => {
    if (refresherEnabled) {
      setRefreshing(!!refresherTriggered)

      if (!RefresherComponent) return

      if (refresherTriggered) {
        translateY.value = withTiming(refresherHeight.value)
        resetScrollState(false)
      } else {
        translateY.value = withTiming(0)
        resetScrollState(true)
      }
    }
  }, [refresherTriggered, RefresherComponent])

  function onRefresh () {
    const { hasRefresher, refresherTriggered } = refresherStateRef.current
    if (hasRefresher && refresherTriggered === undefined) {
      setRefreshing(true)
      setTimeout(() => {
        setRefreshing(false)
        translateY.value = withTiming(0)
        if (!enableScrollValue.value) {
          resetScrollState(true)
        }
      }, 500)
    }
    const { bindrefresherrefresh } = propsRef.current
    bindrefresherrefresh &&
      bindrefresherrefresh(
        getCustomEvent('refresherrefresh', {}, { layoutRef }, propsRef.current)
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
    const scrollTop = event.nativeEvent.contentOffset?.y || 0
    isAtTop.value = scrollTop <= 0
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
      layouts.push({
        length: 0,
        offset,
        index: layouts.length
      })
    })
    return {
      itemLayouts: layouts,
      getItemLayout: (data: any, index: number) => layouts[index]
    }
  }, [convertedListData, useListHeader, itemHeight.value, itemHeight.getter, sectionHeaderHeight.value, sectionHeaderHeight.getter, listHeaderHeight.value, listHeaderHeight.getter])

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
      bounces: hasRefresher ? scrollBounces : bounces
    })
  }
  if (hasRefresher) {
    extendObject(scrollAdditionalProps, {
      scrollEnabled: enableScroll && props.scrollEnabled !== false
    })
  } else if (refresherEnabled) {
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
    'refresher-default-style',
    'refresher-background',
    'refresher-threshold',
    'genericrefresher',
    'bindrefresherrefresh',
    'simultaneous-handlers',
    'wait-for'
  ], { layoutRef })

  // 刷新控件的动画样式
  const refresherAnimatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: -refresherHeight.value,
      transform: [{ translateY: Math.min(translateY.value, refresherHeight.value) }],
      backgroundColor: refresherBackground || 'transparent'
    }
  })

  // 内容区域的动画样式 - 只有内容区域需要下移
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{
        translateY: translateY.value > refresherHeight.value
          ? refresherHeight.value
          : translateY.value
      }]
    }
  })

  function onRefresherLayout (e: LayoutChangeEvent) {
    const { height } = e.nativeEvent.layout
    refresherHeight.value = height
    hasRefresherLayoutRef.current = true
  }

  function updateScrollState (newValue: boolean) {
    'worklet'
    if (enableScrollValue.value !== newValue) {
      enableScrollValue.value = newValue
      runOnJS(runOnJSCallback)('setEnableScroll', newValue)
    }
  }

  const resetScrollState = (value: boolean) => {
    enableScrollValue.value = value
    setEnableScroll(value)
  }

  function updateBouncesState (newValue: boolean) {
    'worklet'
    if (bouncesValue.value !== newValue) {
      bouncesValue.value = newValue
      runOnJS(runOnJSCallback)('setScrollBounces', newValue)
    }
  }

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetY([-5, 5])
      .failOffsetX([-5, 5])
      .onUpdate((event) => {
        'worklet'
        if (enhanced && !!bounces) {
          if (event.translationY > 0 && bouncesValue.value) {
            updateBouncesState(false)
          } else if ((event.translationY < 0) && !bouncesValue.value) {
            updateBouncesState(true)
          }
        }

        if (translateY.value <= 0 && event.translationY < 0) {
          updateScrollState(true)
        } else if (event.translationY > 0 && isAtTop.value) {
          updateScrollState(false)
        }
        if (!enableScrollValue.value && isAtTop.value) {
          if (refreshing) {
            translateY.value = Math.max(
              0,
              Math.min(
                refresherHeight.value,
                refresherHeight.value + event.translationY
              )
            )
          } else if (event.translationY > 0) {
            translateY.value = Math.min(event.translationY * 0.6, refresherHeight.value)
          }
        }
      })
      .onEnd((event) => {
        'worklet'
        if (enableScrollValue.value) return
        if (refreshing) {
          if ((event.translationY > 0 && translateY.value < refresherThreshold) || event.translationY < 0) {
            translateY.value = withTiming(0)
            updateScrollState(true)
            runOnJS(runOnJSCallback)('setRefreshing', false)
          } else {
            translateY.value = withTiming(refresherHeight.value)
          }
        } else if (event.translationY >= refresherHeight.value) {
          translateY.value = withTiming(refresherHeight.value)
          runOnJS(runOnJSCallback)('onRefresh')
        } else {
          translateY.value = withTiming(0)
          updateScrollState(true)
          runOnJS(runOnJSCallback)('setRefreshing', false)
        }
      })
      .simultaneousWithExternalGesture(nativeGesture as any)
  }, [nativeGesture, enhanced, bounces, refreshing, refresherThreshold])

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

  const refresherContent = RefresherComponent
    ? createElement(RefresherComponent, {
      refreshing,
      refresherTriggered
    })
    : null

  const refreshControl = !hasRefresher && refresherEnabled
    ? createElement(RefreshControl, extendObject({
      progressBackgroundColor: refresherBackground,
      onRefresh: onRefresh,
      refreshing: refreshing
    }, getRefresherColor(refresherDefaultStyle)))
    : undefined

  const createSectionList = (sectionListStyle: any) => createElement(
    SectionList,
    extendObject(
      {},
      innerProps,
      {
        style: sectionListStyle,
        sections: convertedListData,
        renderItem: renderItem,
        getItemLayout: getItemLayout,
        ListHeaderComponent: useListHeader ? ListHeaderComponent : null,
        ListFooterComponent: useListFooter ? ListFooterComponent : null,
        renderSectionHeader: renderSectionHeader,
        refreshControl
      }
    )
  )

  if (hasRefresher) {
    return createElement(
      GestureDetector,
      { gesture: panGesture },
      createElement(
        Animated.View,
        { style: [{ height, width }, style, layoutStyle] },
        createElement(
          Animated.View,
          { style: [refresherAnimatedStyle, refresherLayoutStyle], onLayout: onRefresherLayout },
          refresherContent
        ),
        createElement(
          Animated.View,
          { style: [{ flex: 1 }, contentAnimatedStyle] },
          createElement(
            GestureDetector,
            { gesture: nativeGesture },
            createSectionList({ flex: 1 })
          )
        )
      )
    )
  }

  return createElement(
    GestureDetector,
    { gesture: nativeGesture },
    createSectionList([{ height, width }, style, layoutStyle])
  )
})

_SectionList.displayName = 'MpxSectionList'

export default _SectionList
