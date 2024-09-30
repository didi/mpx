
import { View, Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import React, { forwardRef, useRef, useState, useEffect } from 'react'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数
interface ColumnProps {
  children: React.ReactNode,
  selectedIndex: number,
  onColumnLayoutChange: Function,
  getInnerLayout: Function
  onSelectChange: Function
}
// 每个Column 都有个外层的高度, 内部的元素高度
// 默认的高度

const _PickerViewColumn = forwardRef<HandlerRef<View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const { children, selectedIndex, onColumnLayoutChange, onSelectChange, getInnerLayout } = props
  // scrollView的ref
  const { nodeRef: scrollViewRef } = useNodesRef(props, ref, {})
  // scrollView的布局存储
  const layoutRef = useRef({})
  // item的ref
  const itemDomRef = useRef(null)
    // item的布局存储
  const itemPosRef = useRef({})
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

  const onItemLayout = () => {
    itemDomRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      if (height > 0 && itemH !== height) {
        itemPosRef.current = { x, y, width, height, offsetLeft, offsetTop }
        itemH = height
        setItemH(height)
        onColumnLayoutChange && onColumnLayoutChange({ height: height * 5 })
      }
    })
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
    const realChilds = Array.isArray(children) ? children : (children.props?.children && Array.isArray(children.props?.children) ? children.props.children : [children])
    
    const arrChild =  realChilds.map((item: React.ReactNode, index: number) => {
      const InnerProps = index === 0 ? { onLayout: onItemLayout } : {}
      return <View ref={itemDomRef} {...InnerProps}>{item}</View>
    })
    const emptyEle = (<View style={[{height: itemH}]}></View>)
    arrChild.unshift(emptyEle)
    arrChild.unshift(emptyEle)
    arrChild.push(emptyEle)
    arrChild.push(emptyEle)
    return arrChild
  }

  const renderScollView = () => {
    const wheelStyle = {
      // display: "flex",
      // flex: 1,
      height: itemH
    }

    return (<Animated.ScrollView
      style={wheelStyle}
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
      // contentOffset={offset}
      // directionalLockEnabled={true}
      onLayout={onScrollViewLayout}
      // onMomentumScrollBegin={onMomentumScrollBegin}
      // onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}>
      {renderInnerchild()}
    </Animated.ScrollView>)
  }

  return (<View style={[{display: 'flex', flex: 1}]}>
    {renderScollView()}
  </View>)
})

_PickerViewColumn.displayName = 'mpx-picker-view-column';

export default _PickerViewColumn

