import React, { forwardRef } from 'react';
import { SectionList, FlatList } from 'react-native';
import useInnerProps from '../react/getInnerListeners';
import useNodesRef from '../react/useNodesRef'
import { extendObject, getCustomEvent } from '../react/utils'

const getGenericComponent = ({props, ref, generichash, generickey}) => {
  const GenericComponent = global.__mpxGenericsMap[generichash](generickey)
  return <GenericComponent ref={ref} {...props}/>
}

const Item = forwardRef((props, ref) => {
   const { generichash, genericrecycleItem } = props
   return getGenericComponent({props, ref, generichash, generickey: genericrecycleItem})
  })

const SectionHeader = forwardRef((props, ref) => {
  const { generichash, genericsectionHeader } = props
  return getGenericComponent({props, ref, generichash, generickey: genericsectionHeader})
  })

const SectionFooter = forwardRef((props, ref) => {
  const { generichash, genericsectionFooter } = props
  return getGenericComponent({props, ref, generichash, generickey: genericsectionFooter})
})

const ListHeader = forwardRef((props, ref) => {
  const { generichash, genericlistHeader } = props
   return getGenericComponent({props, ref, generichash, generickey: genericlistHeader})
  })

const ListFooter= forwardRef((props, ref) => {
  const { generichash, genericlistFooter } = props
  return getGenericComponent({props, ref, generichash, generickey: genericlistFooter})
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
    genericrecycleItem,
    genericsectionHeader,
    genericsectionFooter,
    genericlistHeader,
    genericlistFooter,
    'enable-sticky': enableSticky = false,
    'enable-back-to-top': enableBackToTop = false,
    'lower-threshold': lowerThreshold = 50,
    'refresher-enabled': refresherEnabled,
    'show-scrollbar': showScrollbar = true,
    'refresher-triggered': refresherTriggered
  } = props

  const scrollViewRef = useRef(null)
  const {
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props: extendObject({}, props, { 'enable-offset': true }), hasSelfPercent, setWidth, setHeight, nodeRef: scrollViewRef })
  
  useNodesRef(props, ref, scrollViewRef, { style })

  function onRefresh() {
    const { bindrefresherrefresh } = props
    bindrefresherrefresh &&
      bindrefresherrefresh(
        getCustomEvent('refresherrefresh', {}, { layoutRef }, props)
    )
  }

  function onEndReached() {
    const { bindscrolltolower } = props
    bindscrolltolower &&
      bindscrolltolower(
        getCustomEvent('scrolltolower', {}, { layoutRef }, props)
      )
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
      onRefresh: onRefresh,
      refreshing: refresherTriggered
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
    type === 'section' ?
      <SectionList
        {...innerProps}
        style={[{ height, width }, style, layoutStyle]}
        sections={listData}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => <Item currentItem={item} generichash={generichash} genericrecycleItem={genericrecycleItem}/>}
        renderSectionHeader={(data) => <SectionHeader data={data.section} generichash={generichash} genericsectionHeader={genericsectionHeader}/>}
        renderSectionFooter={(data) => <SectionFooter data={data.section} generichash={generichash} genericsectionFooter={genericsectionFooter}/>}
        ListHeaderComponent={<ListHeader {...props} generichash={generichash} genericlistHeader={genericlistHeader}/>}
        ListFooterComponent={<ListFooter {...props} generichash={generichash} genericlistFooter={genericlistFooter}/>}
      />
    :
      <FlatList
        {...innerProps}
        style={[{ height, width }, style, layoutStyle]}
        data={listData}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => <Item currentItem={item} generichash={generichash} genericrecycleItem={genericrecycleItem}/>}
        ListHeaderComponent={<ListHeader {...props} generichash={generichash} genericlistHeader={genericlistHeader}/>}
        ListFooterComponent={<ListFooter {...props} generichash={generichash} genericlistFooter={genericlistFooter}/>}
      />
  )
})

export default RecycleView