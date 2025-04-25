import React, { forwardRef, useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { SectionList, FlatList, RefreshControl} from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef from './useNodesRef'
import { extendObject, useLayout, useTransformStyle } from './utils'

const getGenericComponent = ({ props, ref, generichash, generickey }) => {
  const GenericComponent = global.__mpxGenericsMap[generichash](generickey)
  return <GenericComponent ref={ref} {...props}/>
}

const Item = forwardRef((props, ref) => {
  const { generichash, genericrecycleItem } = props
  return getGenericComponent({ props, ref, generichash, generickey: genericrecycleItem })
})

const SectionHeader = forwardRef((props, ref) => {
  const { generichash, genericsectionHeader } = props
  return getGenericComponent({ props, ref, generichash, generickey: genericsectionHeader })
})


const convertToSectionListData = (data) => {
  const sections = []
  let currentSection = null

  data.forEach((item, index) => {
    if (item.isSectionHeader) {
      // 如果已经存在一个 section，先把它添加到 sections 中
      if (currentSection) {
        sections.push(currentSection)
      }
      // 创建新的 section
      currentSection = {
        headerData: item,
        data: [],
        _originalHeaderIndex: index 
      }
    } else {
      // 如果没有当前 section，创建一个默认的
      if (!currentSection) {
        currentSection = {
          headerData: null,
          data: [],
          _originalHeaderIndex: -1
        }
      }
      // 将 item 添加到当前 section 的 data 中
      currentSection.data.push({
        ...item,
        _originalItemIndex: index
      })
    }
  })

  // 添加最后一个 section
  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}
const RecycleView = forwardRef((props = {}, ref) => {
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
    headerHeight={},
    sectionHeaderHeight = {},
    listHeaderHeight = {},
    'genericrecycle-item': genericrecycleItem,
    'genericsection-header': genericsectionHeader,
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

  const convertedListData = useMemo(() => {
    if (type === 'section') {
      return convertToSectionListData(listData) || []
    } else {
      return listData || []
    }
  }, [listData])
  const scrollViewRef = useRef(null)
  const {
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: scrollViewRef })

  useNodesRef(props, ref, scrollViewRef, {
    style,
    node: {
      scrollToIndex
    }
  })

  useEffect(() => {
    if (refreshing !== refresherTriggered) {
      setRefreshing(!!refresherTriggered)
    }
  }, [refresherTriggered])

  function onRefresh () {
    const { bindrefresherrefresh } = props
    bindrefresherrefresh &&
      bindrefresherrefresh(
        getCustomEvent('refresherrefresh', {}, { layoutRef }, props)
      )
  }

  function onEndReached () {
    const { bindscrolltolower } = props
    bindscrolltolower &&
      bindscrolltolower(
        getCustomEvent('scrolltolower', {}, { layoutRef }, props)
      )
  }

  function onScroll (event) {
    const { bindscroll } = props
    bindscroll &&
      bindscroll(
        getCustomEvent('scroll', event.nativeEvent, { layoutRef }, props)
      )
  }

  function getHeight ({ sectionIndex, rowIndex }) {
    if (!itemHeight) {
      return 0
    }
    if (itemHeight.getter) {
      if (type === 'section') {
        const item = convertedListData[sectionIndex].data[rowIndex]
        return itemHeight.getter(item, item._originalItemIndex) || 0
      } else {
        const item = convertedListData[rowIndex]
        return itemHeight.getter(item, rowIndex) || 0
      }
    
    } else {
      return itemHeight.value || 0
    }
  }

  function getHeaderHeight ({ sectionIndex }) {
    const item = convertedListData[sectionIndex]
    const { headerData, _originalHeaderIndex } = item
    if (!headerData || _originalHeaderIndex === -1) return 0
    if (headerHeight.getter) {
      return headerHeight.getter(item, _originalHeaderIndex) || 0
    } else {
      return headerHeight.value || 0
    }
  }

  const renderItem = useCallback(({ item }) => (
    <Item currentItem={item} generichash={generichash} genericrecycleItem={genericrecycleItem}/>
  ), [])

  const renderSectionHeader = useCallback((data) => (
    !data.section.headerData || data.section._originalHeaderIndex === -1 ? null : <SectionHeader dataInfo={data.section} generichash={generichash} genericsectionHeader={genericsectionHeader}/>
  ), [])

  const itemLayouts = useMemo(() => {
    const layouts = []
    let offset = 0

    if (type === 'section') { 
      // 遍历所有 sections
    convertedListData.forEach((section, sectionIndex) => {
      // 添加 section header 的位置信息
      const headerHeight = getHeaderHeight({ sectionIndex })
      layouts.push({
        length: headerHeight,
        offset,
        index: layouts.length
      })
      offset += headerHeight

      // 添加该 section 中所有 items 的位置信息
      section.data.forEach((item, itemIndex) => {
        const contenteight = getHeight({ sectionIndex, rowIndex: itemIndex })
        layouts.push({
          length: contenteight,
          offset,
          index: layouts.length
        })
        offset += contenteight
      })

      layouts.push({
        length: 0,
        offset,
        index: layouts.length
      })
    })
    } else {
      convertedListData.forEach((item, index) => {
        const itemHeightValue = getHeight({ sectionIndex: 0, rowIndex: index })
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

  const getItemLayout = useCallback((data, index) => {
    return itemLayouts[index]
  }, [])

  function scrollToIndex ({ index, animated, viewOffset = 0, viewPosition = 0 }) {
    if (scrollViewRef.current) {
      if (type === 'section') {
        const sectionIndex = convertedListData.findIndex(section => section._originalHeaderIndex === index)
        if (sectionIndex !== -1) {
          scrollViewRef.current.scrollToLocation?.({ itemIndex: 0, sectionIndex, animated, viewOffset, viewPosition })
        } else {
          for (let i = 0; i < convertedListData.length; i++) {
            const section = convertedListData[i]
            const itemIndex = section.data.findIndex(item => item._originalItemIndex === index)
            if (itemIndex !== -1) {
              scrollViewRef.current.scrollToLocation?.({ itemIndex, sectionIndex: i, animated, viewOffset, viewPosition })
              break
            }
          }
        }
      } else {
        scrollViewRef.current.scrollToIndex?.({ index, animated, viewOffset, viewPosition })
      }
    }
  }

  const scrollAdditionalProps = extendObject(
    {
      alwaysBounceVertical: false,
      alwaysBounceHorizontal: false,
      scrollEventThrottle: scrollEventThrottle,
      scrollsToTop: enableBackToTop,
      showsHorizontalScrollIndicator: showScrollbar,
      onEndReachedThreshold: lowerThreshold,
      ref: scrollViewRef,
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

  const innerProps = useInnerProps(props, scrollAdditionalProps, [
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
        {...innerProps}
        style={[{ height, width }, style, layoutStyle]}
        sections={convertedListData}
        keyExtractor={(item, index) => item + index}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        renderSectionHeader={generichash && genericsectionHeader && renderSectionHeader || null}
        refreshControl={refresherEnabled ? <RefreshControl onRefresh={onRefresh} refreshing={refreshing}/> : undefined}
      />
      : <FlatList
        {...innerProps}
        style={[{ height, width }, style, layoutStyle]}
        data={convertedListData}
        keyExtractor={(item, index) => item + index}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        refreshControl={refresherEnabled ? <RefreshControl onRefresh={onRefresh} refreshing={refreshing}/> : undefined}
      />
  )
})

export default RecycleView
