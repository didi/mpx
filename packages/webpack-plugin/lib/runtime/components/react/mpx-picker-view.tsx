import { View } from 'react-native'
import { LinearGradient, LinearGradientProps } from 'react-native-linear-gradient'
import React, { forwardRef, useState, useRef, ReactElement, JSX } from 'react'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { parseInlineStyle, useTransformStyle, splitStyle, splitProps, useLayout, wrapChildren } from './utils'
/**
 * ✔ value
 * ✔ bindchange
 * ✘ bindpickstart
 * ✘ bindpickend
 * ✘ mask-class
 * ✔ indicator-style: 优先级indicator-style.height > pick-view-column中的子元素设置的height
 * ✘ indicator-class
 * ✘ mask-style
 * ✘ immediate-change
 */

interface PickerViewProps {
  children: React.ReactNode
  // 初始的defaultValue数组中的数字依次表示 picker-view 内的 picker-view-column 选择的第几项（下标从 0 开始），数字大于 picker-view-column 可选项长度时，选择最后一项。
  value?: Array<number>
  bindchange?: Function
  style: {
    [key: string]: any
  }
  'indicator-style'?: string
  'enable-var': boolean
  'external-var-context'?: Record<string, any>,
  'enable-offset': boolean
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
  const { children, value = [], bindchange, style, 'enable-var': enableVar, 'external-var-context': externalVarContext } = props
  // indicatorStyle 需要转换为rn的style
  // 微信设置到pick-view上上设置的normalStyle如border等需要转换成RN的style然后进行透传
  const indicatorStyle = parseInlineStyle(props['indicator-style'])
  const { height: indicatorH, width: indicatorW } = indicatorStyle
  const nodeRef = useRef(null)
  //  picker-view 设置的color等textStyle,在小程序上的表现是可以继承到最内层的text样式, 但是RN内部column是slot无法设置, 需要业务自己在column内的元素上设置
  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext })

  useNodesRef<View, PickerViewProps>(props, ref, nodeRef, {
    style: normalStyle
  })

  const { textStyle } = splitStyle(normalStyle)
  const { textProps } = splitProps(props)
  const {
    // 存储layout布局信息
    layoutRef,
    layoutProps,
    layoutStyle
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: nodeRef })

  const isSetW = indicatorW !== undefined ? 1 : 0
  const cloneRef = useRef(null)
  const maskPos: PosType = {}
  let [pickH, setPickH] = useState(0)
  const itemH = pickH / 5
  if (normalStyle?.height && pickH && pickH !== normalStyle?.height) {
    maskPos.height = itemH * 2 + Math.ceil((normalStyle.height - pickH) / 2)
  } else {
    maskPos.height = itemH * 2
  }

  const onColumnLayoutChange = (layoutConfig: PickerLayout) => {
    pickH = layoutConfig.height
    setPickH(layoutConfig.height)
  }

  const onSelectChange = (columnIndex: number, selIndex: number) => {
    const changeValue = value.slice()
    changeValue[columnIndex] = selIndex
    const eventData = getCustomEvent('change', {}, { detail: { value: changeValue, source: 'change' }, layoutRef })
    bindchange && bindchange(eventData)
  }

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    style: {
      ...normalStyle,
      ...layoutStyle,
      position: 'relative',
      overflow: 'hidden'
    },
    ...layoutProps
  }, [
    'enable-offset'
  ], { layoutRef })

  const cloneChild = (child: React.ReactNode, index: number) => {
    // const extraProps = index === 0 ? { getInnerLayout: getInnerLayout, innerProps } : {}
    const extraProps = {}
    const childProps = {
      ...(child as ReactElement)?.props,
      ref: cloneRef,
      prefix: index,
      key: 'pick-view' + index,
      wrapperStyle: {
        height: normalStyle?.height || 0,
        itemHeight: indicatorH || 0
      },
      onColumnLayoutChange,
      onSelectChange: onSelectChange.bind(null, index),
      selectedIndex: value?.[index] || 0,
      ...extraProps
    }
    const realElement = React.cloneElement(child as ReactElement, childProps)
    return wrapChildren(
      {
        children: realElement
      },
      {
        hasVarDec,
        varContext: varContextRef.current,
        textStyle,
        textProps
      }
    )
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

  const renderLine = () => {
    return <View style={[{
      position: 'absolute',
      top: '50%',
      transform: [{ translateY: -(itemH / 2) }],
      height: itemH,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#f0f0f0',
      width: '100%',
      zIndex: 101
    }]}></View>
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
  return (<View {...innerProps}>
    {renderTopMask()}
    <View style={[styles.wrapper]}>
      {renderSubChild()}
    </View>
    {renderBottomMask()}
    {!isSetW && renderLine()}
  </View>)
})

_PickerView.displayName = 'mpx-picker-view'

export default _PickerView
