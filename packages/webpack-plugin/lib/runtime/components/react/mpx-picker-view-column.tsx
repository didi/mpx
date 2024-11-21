
import { View, Animated, SafeAreaView, NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent, ScrollView } from 'react-native'
import React, { forwardRef, useRef, useState, useEffect, ReactElement, ReactNode } from 'react'
import { useTransformStyle, splitStyle, splitProps, wrapChildren, useLayout } from './utils'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
interface ColumnProps {
  children: React.ReactNode,
  selectedIndex: number,
  onColumnLayoutChange: Function,
  getInnerLayout: Function,
  onSelectChange: Function,
  style: {
    [key: string]: any
  },
  'enable-var': boolean
  'external-var-context'?: Record<string, any>
  wrapperStyle: {
    height?: number,
    itemHeight: string
  },
  prefix: number
}
const defaultItemHeight = 36
// 每个Column 都有个外层的高度, 内部的元素高度
// 默认的高度
const PickerViewColumn = forwardRef<HandlerRef<ScrollView & View, ColumnProps>, ColumnProps>((props: ColumnProps, ref) => {
  const { children, selectedIndex, onColumnLayoutChange, onSelectChange, getInnerLayout, style, wrapperStyle, 'enable-var': enableVar, 'external-var-context': externalVarContext } = props
  // PickerViewColumn
  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext })
  const { textStyle } = splitStyle(normalStyle)
  const { textProps } = splitProps(props)
  // const { innerStyle } = splitStyle(normalStyle)
  // scrollView的ref
  const scrollViewRef = useRef<ScrollView>(null)
  useNodesRef(props, ref, scrollViewRef, {})
  // 每个元素的高度
  let [itemH, setItemH] = useState(0)

  useEffect(() => {
    if (selectedIndex && itemH) {
      const offsetY = selectedIndex * itemH
      scrollViewRef.current?.scrollTo({ x: 0, y: offsetY, animated: true })
    }
  }, [selectedIndex, itemH])

  const onScrollViewLayout = () => {
    getInnerLayout && getInnerLayout(layoutRef)
  }

  const {
    // 存储layout布局信息
    layoutRef,
    layoutProps
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: scrollViewRef, onLayout: onScrollViewLayout })

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
      const selIndex = Math.floor(scrollY / itemH)
      onSelectChange(selIndex)
    }
  }

  const renderInnerchild = () => {
    // Fragment 节点
    let realElement: Array<ReactNode> = []
    const getRealChilds = () => {
      if (Array.isArray(children)) {
        realElement = children
      } else {
        const tempChild = children as ReactElement
        if (tempChild.props.children && tempChild.props.children) {
          realElement = tempChild.props.children
        } else {
          realElement = [children]
        }
      }
      return realElement
    }

    const realChilds = getRealChilds()
    const arrChild = realChilds.map((item: React.ReactNode, index: number) => {
      const InnerProps = index === 0 ? { onLayout: onItemLayout } : {}
      const strKey = 'picker' + props.prefix + '-column' + index
      const arrHeight = (wrapperStyle.itemHeight + '').match(/\d+/g) || []
      const iHeight = (arrHeight[0] || defaultItemHeight) as number
      return <View key={strKey} {...InnerProps} style={[{ height: iHeight, width: '100%' }]}>
        {wrapChildren(
          {
            children: item
          },
          {
            hasVarDec,
            varContext: varContextRef.current,
            textStyle,
            textProps
          }
        )}
      </View>
    })
    const totalHeight = itemH * 5
    if (wrapperStyle.height && totalHeight !== wrapperStyle.height) {
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
      {...layoutProps}
      onMomentumScrollEnd={onMomentumScrollEnd}>
        {renderInnerchild()}
    </Animated.ScrollView>)
  }

  return (<SafeAreaView style={[{ display: 'flex', flex: 1 }]}>
    { renderScollView() }
  </SafeAreaView>)
})

PickerViewColumn.displayName = 'MpxPickerViewColumn'
export default PickerViewColumn
