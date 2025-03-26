import React, { forwardRef } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  SectionList,
  StatusBar,
} from 'react-native';

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
  const { style, height, width, listData, generichash, genericrecycleItem, genericsectionHeader, genericsectionFooter, genericlistHeader, genericlistFooter, 'enable-sticky': enableSticky = false} = props
  return (
      <SectionList
        style={[{ height, width }, style]}
        sections={listData}
        stickySectionHeadersEnabled={enableSticky}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => <Item currentItem={item} generichash={generichash} genericrecycleItem={genericrecycleItem}/>}
        renderSectionHeader={(data) => <SectionHeader data={data.section} generichash={generichash} genericsectionHeader={genericsectionHeader}/>}
        renderSectionFooter={(data) => <SectionFooter data={data.section} generichash={generichash} genericsectionFooter={genericsectionFooter}/>}
        ListHeaderComponent={<ListHeader {...props} generichash={generichash} genericlistHeader={genericlistHeader}/>}
        ListFooterComponent={<ListFooter {...props} generichash={generichash} genericlistFooter={genericlistFooter}/>}
      />
  )

})

export default RecycleView