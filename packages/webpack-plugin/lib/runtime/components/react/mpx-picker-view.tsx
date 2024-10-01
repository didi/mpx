import { View, ViewStyle } from 'react-native'
import React, { forwardRef, MutableRefObject, useState, useRef } from 'react'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
/**
 * ✔ value
 * ✔ bindchange
 * ✘ bindpickstart
 * ✘ bindpickend
 * ✘ mask-class
 * ✘ indicator-style
 * ✘ indicator-class
 * ✘ mask-style
 * ✘ immediate-change
 */

interface PickerViewProps {
  children: React.ReactNode
  // 初始的defaultValue数组中的数字依次表示 picker-view 内的 picker-view-column 选择的第几项（下标从 0 开始），数字大于 picker-view-column 可选项长度时，选择最后一项。
  value?: Array<number>
  bindchange?: Function
  style?: Object
}

interface PickerLayout {
  height: number,
  itemHeight: number
}

const styles: { [key: string]: Object } = {
  wrapper: {
    display: 'flex',
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    overflow: 'hidden'
  },

  maskTop: {
    position: 'absolute',
    backgroundColor: "#fcfcfc",
    opacity: 0.6,
    top: 0,
    width: "100%",
    zIndex: 100
  },

  maskBottom: {
    position: 'absolute',
    backgroundColor: "#fcfcfc",
    opacity: 0.6,
    bottom: 0,
    width: "100%",
    zIndex: 100
  }
}
const _PickerView = forwardRef<HandlerRef<View, PickerViewProps>, PickerViewProps>((props: PickerViewProps, ref) => {
  const { children, value = [], bindchange, style} = props
  const innerLayout = useRef({})
  const cloneRef = useRef(null)
  const wrapRef = useRef(null)
  let [pickH, setPickH] = useState(0)

  const { nodeRef } = useNodesRef<View, PickerViewProps>(props, ref, {})

  // value 如何关联picker-view-column这几个slot的内容呢

  const onColumnLayoutChange = (layoutConfig: PickerLayout) => {
    pickH = layoutConfig.height
    setPickH(layoutConfig.height)
  }

  const onSelectChange = (columnIndex: number, selIndex: number) => {
    const changeValue = value.slice()
    changeValue[columnIndex] = selIndex
    const eventData = getCustomEvent('change', {}, { detail: { value: changeValue, source: 'change' }, layoutRef: {} })
    // console.log('-------------------onSelectChange:eventData', eventData)
    bindchange && bindchange(eventData)
  }
  
  const onWrapperLayout = (e) => {
    wrapRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      const a = { x, y, width, height, offsetLeft, offsetTop }
      console.log('-----onWrapperLayout', a)
    })
  }

  const getInnerLayout = (layout: MutableRefObject<{}>) => {
    innerLayout.current = layout.current
    console.log('--------------getInnerLayout', innerLayout)
  }

  const innerProps = useInnerProps(props, {ref: nodeRef}, [], { layoutRef: innerLayout })

  const cloneChild = (child: React.ReactNode, index: number) => {
    const extraProps = index === 0 ? {
      getInnerLayout: getInnerLayout,
      innerProps
    } : {}
    const childProps = {
      ...child.props,
      ref: cloneRef,
      onColumnLayoutChange,
      onSelectChange: onSelectChange.bind(null, index),
      selectedIndex: value?.[index] || 0,
      ...extraProps
    }
    return React.cloneElement(child, childProps)
  }  

  const renderTopMask = () => {
    return <View style={[styles.maskTop, { height: pickH / 5 * 2, top: 0, pointerEvents: "none"}]}></View>
  }

  const renderBottomMask = () => {
    return <View style={[styles.maskBottom, { height: pickH / 5 * 2, bottom: 0, pointerEvents: "none"}]}></View>
  }

  const renderSubChild = () => {
    if (Array.isArray(children)) {
      return children.map((item, index) => {
        return cloneChild(item, index)
      })
    } else {
      return cloneChild(children, 0)
    }
  }
  // innerLayout.current.offsetTop 
  console.log('----------mpx-picker-view: render', style)
  return (<View style={[style, { position: 'relative' }]}  onLayout={onWrapperLayout} ref={wrapRef}>
    {renderTopMask()}
    <View style={[styles.wrapper]}>
      {renderSubChild()}
    </View>
    {renderBottomMask()}
  </View>)
  /*
  return (<View style={[{height: pickH}]}>
    <View style={[styles.wrapper, { height: pickH }]}>
      {renderSubChild()}
    </View>
  </View>)
  */
})

_PickerView.displayName = 'mpx-picker-view';

export default _PickerView
