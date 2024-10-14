
import { View, Animated, SafeAreaView, NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent, ScrollView } from 'react-native'
import React, { forwardRef, useRef, useState, useEffect, ReactElement } from 'react'
// import { Reanimated } from 'react-native-reanimated';
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
interface ColumnProps {
  children: React.ReactNode,
  selectedIndex: number,
  onColumnLayoutChange: Function,
  getInnerLayout: Function,
  onSelectChange: Function,
  style: Object,
  wrapperStyle: {
    height?: number
  },
  prefix: number
}
// 每个Column 都有个外层的高度, 内部的元素高度
// 默认的高度
// const AnimatedScrollView = Reanimated.createAnimatedComponent(ScrollView);
const _PickerViewColumn = forwardRef<HandlerRef<ScrollView & View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const { children, selectedIndex, onColumnLayoutChange, onSelectChange, getInnerLayout, wrapperStyle } = props
  // scrollView的ref
  const { nodeRef: scrollViewRef } = useNodesRef(props, ref, {})
  // scrollView的布局存储
  const layoutRef = useRef({})
  // 每个元素的高度
  let [itemH, setItemH] = useState(0)
  // scrollView内容的初始offset
  let [offset, setOffset] = useState(0)

  useEffect(() => {
    if (selectedIndex && itemH) {
      offset = (selectedIndex + 2) * itemH
      setOffset(offset)
    }
  }, [selectedIndex, itemH])

  const onScrollViewLayout = () => {
    scrollViewRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      getInnerLayout && getInnerLayout(layoutRef)
    })
  }

  const onItemLayout = (e: LayoutChangeEvent) => {
    const layout = e.nativeEvent.layout
    if (layout.height && itemH !== layout.height) {
      itemH = layout.height
      setItemH(layout.height)
      onColumnLayoutChange && onColumnLayoutChange({ height: layout.height * 5 })
    }
  }

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (scrollViewRef && itemH) {
      const { y: scrollY } = e.nativeEvent.contentOffset
      const selIndex = scrollY / itemH
      onSelectChange(selIndex)
    }
  }

  const renderInnerchild = () => {
    // Fragment 节点
    const getRealChilds = () => {
      if (Array.isArray(children)) {
        return children
      } else {
        const tempChild = children as ReactElement
        if (tempChild.props.children && tempChild.props.children) {
          return tempChild.props.children
        } else {
          return [children]
        }
      }
    }
    // const realChilds = Array.isArray(children) ? children : (children?.props?.children && Array.isArray(children.props?.children) ? children.props.children : [children])
    const realChilds = getRealChilds()
    const arrChild = realChilds.map((item: React.ReactNode, index: number) => {
      const InnerProps = index === 0 ? { onLayout: onItemLayout } : {}
      const strKey = 'picker' + props.prefix + '-column' + index
      return <View key={strKey} {...InnerProps}>{item}</View>
    })
    const totalHeight = itemH * 5
    if (wrapperStyle.height && totalHeight > wrapperStyle.height) {
      const fix = Math.ceil((totalHeight - wrapperStyle.height) / 2)
      arrChild.unshift(<View key="picker-column-0" style={[{ height: itemH - fix }]}></View>)
      arrChild.unshift(<View key="picker-column-1" style={[{ height: itemH }]}></View>)
      arrChild.push(<View key="picker-column-2" style={[{ height: itemH }]}></View>)
      arrChild.push(<View key="picker-column-3" style={[{ height: itemH - fix }]}></View>)
    } else {
      arrChild.unshift(<View key="picker-column-0" style={[{ height: itemH }]}></View>)
      arrChild.unshift(<View key="picker-column-1" style={[{ height: itemH }]}></View>)
      arrChild.push(<View key="picker-column-2" style={[{ height: itemH }]}></View>)
      arrChild.push(<View key="picker-column-3" style={[{ height: itemH }]}></View>)
    }
    return arrChild
  }

  const renderScollView = () => {
    const contentContainerStyle = {
      textAlign: 'center'
    }

    return (<Animated.ScrollView
      horizontal={false}
      ref={scrollViewRef}
      bounces={false}
      scrollsToTop={false}
      removeClippedSubviews={true}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      pagingEnabled={false}
      snapToInterval={itemH}
      automaticallyAdjustContentInsets={false}
      onLayout={onScrollViewLayout}
      onMomentumScrollEnd={onMomentumScrollEnd}>
        {renderInnerchild()}
    </Animated.ScrollView>)
  }

  return (<SafeAreaView style={[{ display: 'flex', flex: 1 }]}>
    { renderScollView() }
  </SafeAreaView>)
})

_PickerViewColumn.displayName = 'mpx-picker-view-column'
export default _PickerViewColumn
