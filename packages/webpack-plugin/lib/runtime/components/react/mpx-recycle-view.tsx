import React, { forwardRef, useRef, useCallback, useState, useEffect } from 'react'
import { SectionList, FlatList, RefreshControl, Text, View} from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef from './useNodesRef'
import { extendObject, useLayout, useTransformStyle } from './utils'
import sectionListGetItemLayout from './getLayout'

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
      scrollToLocation,
      scrollToOffset,
      scrollToIndex
    }
  })

  // setTimeout(() => {
  //   scrollToLocation({
  //     itemIndex: 1, sectionIndex: 3
  //   })
  // }, 3000)
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

  function getHeight ({ sectionIndex, rowIndex, key }) {
    if (!key) {
      return 0
    }
    if (key.getter) {
      const item = listData[sectionIndex].data[rowIndex]
      return key.getter(item, item.originalIndex) || 0
    } else {
      return key.value || 0
    }
  }

  function getHeaderHeight ({ sectionIndex }) {
    const item = listData[sectionIndex]
    const { originalIndex = -1 } = item
    if (originalIndex === -1) return 0
    if (headerHeight.getter) {
      return headerHeight.getter(item, originalIndex) || 0
    } else {
      return headerHeight.value || 0
    }
  }

  const renderItem = useCallback(({ item }) => (
    <Item currentItem={item} generichash={generichash} genericrecycleItem={genericrecycleItem}/>
  ), [])

  const renderSectionHeader = useCallback((data) => (
    data.section.originalIndex !== -1 ? <SectionHeader dataInfo={data.section} generichash={generichash} genericsectionHeader={genericsectionHeader}/> : null
  ), [])

  // function getSectionItemLayout (data, index) {
  //   // console.log(data, index)
  //   // // todo 需要计算 sectionHeader、sectionFooter、listHeader、itemHeight
  //   // // https://github.com/jsoendermann/rn-section-list-get-item-layout/blob/master/index.ts
  //   // return {
  //   //   length: getHeight({ data, index, key: itemHeight }),
  //   //   offset: getHeight({ data, index, key: itemHeight }) * index || 0,
  //   //   index
  //   // }
  // }

  const getSectionItemLayout = sectionListGetItemLayout({
    // The height of the row with rowData at the given sectionIndex and rowIndex
    getItemHeight: (rowData, sectionIndex, rowIndex) => getHeight({sectionIndex, rowIndex, key: itemHeight  }),
    getSectionHeaderHeight: (sectionIndex) => getHeaderHeight({ sectionIndex }),
  })

  function getItemLayout (data, index) {
    return {
      length: getHeight({ data, index, key: itemHeight }),
      offset: getHeight({ data, index, key: listHeaderHeight }) + getHeight({ data, index, key: itemHeight }) * index || 0,
      index
    }
  }

  function scrollToLocation ({
    itemIndex,
    sectionIndex,
    animated,
    viewOffset = 0,
    viewPosition = 0
  }) {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToLocation?.({ itemIndex, sectionIndex, animated, viewOffset, viewPosition })
    }
  }

  function scrollToOffset ({ offset, animated }) {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToOffset({ offset, animated })
    }
  }

  function scrollToIndex ({ index, animated, viewOffset = 0, viewPosition = 0 }) {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToIndex?.({ index, animated, viewOffset, viewPosition })
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
        sections={listData}
        keyExtractor={(item, index) => item + index}
        renderItem={renderItem}
        getItemLayout={getSectionItemLayout}
        renderSectionHeader={generichash && genericsectionHeader && renderSectionHeader || null}
        refreshControl={refresherEnabled ? <RefreshControl onRefresh={onRefresh} refreshing={refreshing}/> : undefined}
      />
      : <FlatList
        {...innerProps}
        style={[{ height, width }, style, layoutStyle]}
        data={listData}
        keyExtractor={(item, index) => item + index}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        refreshControl={refresherEnabled ? <RefreshControl onRefresh={onRefresh} refreshing={refreshing}/> : undefined}
      />
  )
})

export default RecycleView
