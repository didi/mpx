import { View } from 'react-native'
import { LinearGradient, LinearGradientProps } from 'react-native-linear-gradient'
import React, { forwardRef, MutableRefObject, useState, useRef, ReactElement, JSX } from 'react'
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
  style?: {
    height?: number
  }
}

interface PickerLayout {
  height: number,
  itemHeight: number
}

interface PosType {
  height?: number,
  top?: number
}

const styles: { [key: string]: Object } = {
  wrapper: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    overflow: 'hidden',
    alignItems: 'center'
  },
  maskTop: {
    position: 'absolute',
    width: 1000,
    zIndex: 100
  },
  maskBottom: {
    position: 'absolute',
    width: 1000,
    zIndex: 100
  }
}
const _PickerView = forwardRef<HandlerRef<View, PickerViewProps>, PickerViewProps>((props: PickerViewProps, ref) => {
  const { children, value = [], bindchange, style } = props
  const innerLayout = useRef({})
  const cloneRef = useRef(null)
  const wrapRef = useRef(null)
  const maskPos: PosType = {}
  let [pickH, setPickH] = useState(0)
  if (style?.height && pickH) {
    maskPos.height = pickH / 5 * 2 + (style.height - pickH)
  } else {
    maskPos.height = pickH / 5 * 2
  }

  const { nodeRef } = useNodesRef<View, PickerViewProps>(props, ref, {})

  // value 如何关联picker-view-column这几个slot的内容呢

  const onColumnLayoutChange = (layoutConfig: PickerLayout) => {
    pickH = layoutConfig.height
    setPickH(layoutConfig.height)
  }

  const onSelectChange = (columnIndex: number, selIndex: number) => {
    const changeValue = value.slice()
    changeValue[columnIndex] = selIndex
    const eventData = getCustomEvent('change', {}, { detail: { value: changeValue, source: 'change' }, layoutRef: innerLayout })
    bindchange && bindchange(eventData)
  }
  /*
  const onWrapperLayout = () => {
    wrapRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      const a = { x, y, width, height, offsetLeft, offsetTop }
    })
  }
  */
  const getInnerLayout = (layout: MutableRefObject<{}>) => {
    innerLayout.current = layout.current
  }

  const innerProps = useInnerProps(props, { ref: nodeRef }, [], { layoutRef: innerLayout })

  const cloneChild = (child: React.ReactNode, index: number) => {
    const extraProps = index === 0 ? { getInnerLayout: getInnerLayout, innerProps } : {}
    const childProps = {
      ...(child as ReactElement)?.props,
      ref: cloneRef,
      prefix: index,
      key: 'pick-view' + index,
      wrapperStyle: {
        height: style?.height || 0
      },
      onColumnLayoutChange,
      onSelectChange: onSelectChange.bind(null, index),
      selectedIndex: value?.[index] || 0,
      ...extraProps
    }
    return React.cloneElement(child as ReactElement, childProps)
  }

  const renderTopMask = () => {
    const linearProps: LinearGradientProps = {
      colors: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.2)'],
      style: [
        styles.maskTop,
        {
          height: maskPos.height,
          top: 0,
          pointerEvents: 'none'
        }
      ]
    }
    return (<LinearGradient {...linearProps}/>)
  }

  const renderBottomMask = () => {
    const linearProps: LinearGradientProps = {
      colors: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.8)'],
      style: [
        styles.maskBottom,
        {
          height: maskPos.height,
          bottom: 0,
          pointerEvents: 'none'
        }
      ]
    }
    return <LinearGradient {...linearProps}></LinearGradient>
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
  return (<View style={[style, { position: 'relative', overflow: 'hidden' }]} ref={wrapRef}>
    {renderTopMask()}
    <View style={[styles.wrapper]}>
      {renderSubChild()}
    </View>
    {renderBottomMask()}
  </View>)
})

_PickerView.displayName = 'mpx-picker-view'

export default _PickerView
