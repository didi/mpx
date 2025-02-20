import { View } from 'react-native'
import React, { forwardRef, useRef } from 'react'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import {
  useLayout,
  splitProps,
  splitStyle,
  wrapChildren,
  useTransformStyle,
  extendObject
} from './utils'
import { PickerViewStyleContext } from './pickerVIewContext'
import type { AnyFunc } from './types/common'
/**
 * ✔ value
 * ✔ bindchange
 * ✘ bindpickstart
 * ✘ bindpickend
 * ✔ mask-class
 * ✔ indicator-style: 优先级indicator-style.height > pick-view-column中的子元素设置的height
 * WebView Only:
 * ✔ indicator-class
 * ✔ mask-style
 * ✘ immediate-change
 */

interface PickerViewProps {
  children: React.ReactNode
  value?: Array<number>
  bindchange?: AnyFunc
  style: {
    [key: string]: any
  }
  'indicator-style'?: Record<string, any>,
  'mask-style'?: Record<string, any>,
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

const DefaultPickerItemH = 36

const _PickerView = forwardRef<HandlerRef<View, PickerViewProps>, PickerViewProps>((props: PickerViewProps, ref) => {
  const {
    children,
    value = [],
    bindchange,
    style,
    'indicator-style': indicatorStyle = {},
    'mask-style': pickerMaskStyle = {},
    'enable-var': enableVar,
    'external-var-context': externalVarContext
  } = props
  const { height: indicatorH, ...pickerIndicatorStyle } = indicatorStyle
  const nodeRef = useRef(null)
  const cloneRef = useRef(null)
  const activeValueRef = useRef(value)
  activeValueRef.current = value.slice()
  const snapActiveValueRef = useRef<number[] | null>(null)

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
    layoutRef,
    layoutProps,
    layoutStyle
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: nodeRef })
  const { textProps } = splitProps(props)
  const { textStyle } = splitStyle(normalStyle)

  const onSelectChange = (columnIndex: number, selectedIndex: number) => {
    const activeValue = activeValueRef.current
    activeValue[columnIndex] = selectedIndex
    const eventData = getCustomEvent(
      'change',
      {},
      { detail: { value: activeValue.slice(), source: 'change' }, layoutRef }
    )
    bindchange?.(eventData)
    snapActiveValueRef.current = activeValueRef.current
  }

  const hasDiff = (a: number[] = [], b: number[]) => {
    return a.some((v, i) => v !== b[i])
  }

  const onInitialChange = (isInvalid: boolean, value: number[]) => {
    if (isInvalid || !snapActiveValueRef.current || hasDiff(snapActiveValueRef.current, value)) {
      const eventData = getCustomEvent(
        'change',
        {},
        { detail: { value: value.slice(), source: 'change' }, layoutRef }
      )
      bindchange?.(eventData)
      snapActiveValueRef.current = value.slice()
    }
  }

  const innerProps = useInnerProps(
    props,
    extendObject({
      ref: nodeRef,
      style: extendObject(
        {},
        normalStyle,
        layoutStyle,
        {
          position: 'relative',
          overflow: 'hidden'
        }
      ),
      layoutProps
    }),
    [
      'enable-offset',
      'indicator-style',
      'indicator-class',
      'mask-style',
      'mask-class'
    ],
    { layoutRef }
  )

  const renderColumn = (child: React.ReactElement, index: number, columnData: React.ReactNode[], initialIndex: number) => {
    const childProps = child?.props || {}
    const wrappedProps = extendObject(
      {},
      childProps,
      {
        columnData,
        ref: cloneRef,
        columnIndex: index,
        key: `pick-view-${index}`,
        wrapperStyle: {
          height: normalStyle?.height || DefaultPickerItemH,
          itemHeight: indicatorH || DefaultPickerItemH
        },
        onSelectChange: onSelectChange.bind(null, index),
        initialIndex,
        pickerIndicatorStyle,
        pickerMaskStyle
      }
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
    onInitialChange(isInvalid, validValue)
    return renderColumns
  }

  return (
    <PickerViewStyleContext.Provider value={textStyle}>
      <View {...innerProps}>
        <View style={[styles.wrapper]}>{renderPickerColumns()}</View>
      </View>
    </PickerViewStyleContext.Provider>
  )
})

_PickerView.displayName = 'MpxPickerView'
export default _PickerView
