import { View } from 'react-native'
import React, { forwardRef, useState, useRef } from 'react'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import {
  useLayout,
  splitProps,
  splitStyle,
  wrapChildren,
  parseInlineStyle,
  useTransformStyle,
  useDebounceCallback,
  useStableCallback,
  extendObject
} from './utils'
import type { AnyFunc } from './types/common'
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
  // 初始的defaultValue数组中的数字依次表示 picker-view 内的 picker-view-column 选择的第几项（下标从 0 开始），
  // 数字大于 picker-view-column 可选项长度时，选择最后一项。
  value?: Array<number>
  bindchange?: AnyFunc
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
  }
}

const _PickerView = forwardRef<HandlerRef<View, PickerViewProps>, PickerViewProps>((props: PickerViewProps, ref) => {
  const {
    children,
    value = [],
    bindchange,
    style,
    'enable-var': enableVar,
    'external-var-context': externalVarContext
  } = props

  // indicatorStyle 需要转换为rn的style
  // 微信设置到pick-view上上设置的normalStyle如border等需要转换成RN的style然后进行透传
  const indicatorStyle = parseInlineStyle(props['indicator-style'])
  const { height: indicatorH, ...pickerOverlayStyle } = indicatorStyle
  const [pickMaxH, setPickMaxH] = useState(0)
  const nodeRef = useRef(null)
  const cloneRef = useRef(null)
  const activeValueRef = useRef(value)
  activeValueRef.current = value.slice()

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

  const {
    // 存储layout布局信息
    layoutRef,
    layoutProps,
    layoutStyle
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: nodeRef })
  const { textProps } = splitProps(props)
  const { textStyle } = splitStyle(normalStyle)

  const onColumnItemRawHChange = (height: number) => {
    if (height > pickMaxH) {
      setPickMaxH(height)
    }
  }

  const bindchangeDebounce = useDebounceCallback(useStableCallback(bindchange), 300)

  const onSelectChange = (columnIndex: number, selectedIndex: number) => {
    bindchangeDebounce.clear()
    const activeValue = activeValueRef.current
    activeValue[columnIndex] = selectedIndex
    const eventData = getCustomEvent(
      'change',
      {},
      { detail: { value: activeValue, source: 'change' }, layoutRef }
    )
    bindchangeDebounce(eventData)
  }

  const onInitialChange = (value: number[]) => {
    const eventData = getCustomEvent(
      'change',
      {},
      { detail: { value, source: 'change' }, layoutRef }
    )
    bindchange?.(eventData) // immediate
  }

  const innerProps = useInnerProps(
    props,
    extendObject({
      ref: nodeRef,
      style: extendObject(
        normalStyle,
        layoutStyle,
        {
          position: 'relative',
          overflow: 'hidden'
        }
      ),
      layoutProps
    }),
    ['enable-offset'],
    { layoutRef }
  )

  const renderColumn = (child: React.ReactElement, index: number, columnData: React.ReactNode[], initialIndex: number) => {
    const extraProps = {}
    const childProps = child?.props || {}
    const wrappedProps = extendObject(
      childProps,
      {
        columnData,
        ref: cloneRef,
        columnIndex: index,
        key: `pick-view-${index}`,
        wrapperStyle: {
          height: normalStyle?.height || 0,
          itemHeight: indicatorH || 0
        },
        onColumnItemRawHChange,
        onSelectChange: onSelectChange.bind(null, index),
        initialIndex,
        pickerOverlayStyle
      },
      extraProps
    )
    const realElement = React.cloneElement(child, wrappedProps)
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

  const validateChildInitialIndex = (index: number, data: React.ReactNode[]) => {
    return Math.max(0, Math.min(value[index] || 0, data.length - 1))
  }

  const flatColumnChildren = (data: React.ReactElement) => {
    const columnData = React.Children.toArray(data?.props?.children)
    if (columnData.length === 1 && React.isValidElement(columnData[0]) && columnData[0].type === React.Fragment) {
      // 只有一个 Fragment 嵌套情况
      return React.Children.toArray(columnData[0].props.children)
    }
    return columnData
  }

  const renderPickerColumns = () => {
    const columns = React.Children.toArray(children)
    const renderColumns: React.ReactNode[] = []
    const validValue: number[] = []
    let isInvalid = false
    columns.forEach((item: React.ReactElement, index) => {
      const columnData = flatColumnChildren(item)
      const validIndex = validateChildInitialIndex(index, columnData)
      if (validIndex !== value[index]) {
        isInvalid = true
      }
      validValue.push(validIndex)
      renderColumns.push(renderColumn(item, index, columnData, validIndex))
    })
    isInvalid && onInitialChange(validValue)
    return renderColumns
  }

  return (
    <View {...innerProps}>
      <View style={[styles.wrapper]}>{renderPickerColumns()}</View>
    </View>
  )
})

_PickerView.displayName = 'MpxPickerView'

export default _PickerView
