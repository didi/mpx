import { View, TouchableWithoutFeedback } from 'react-native'
import { Picker, PickerValue } from '@ant-design/react-native'
import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { MultiSelectorProps, LayoutType } from './type'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数

function convertToObj (item?: any, rangeKey = ''): any {
  if (typeof item === 'object') {
    return { value: item[rangeKey], label: item[rangeKey] }
  } else {
    return { value: item, label: item }
  }
}

// eslint-disable-next-line default-param-last
function formatRangeFun (range: any[][] = [], rangeKey?: string): any[] {
  const result = (range[0] || []).map(item => {
    return convertToObj(item, rangeKey)
  })
  let tmp = result
  for (let i = 1; i < range.length; i++) {
    const child = Array.isArray(range[i]) ? range[i] : []
    const nextColData = child.map(item => {
      return convertToObj(item, rangeKey)
    })
    tmp.forEach(item => {
      item.children = nextColData
    })
    tmp = nextColData
  }
  return result
}

function getIndexByValues (range: any[] = [], value: any[] = []): number[] {
  let tmp = range
  return value.map(v => {
    for (let i = 0; i < tmp.length; i++) {
      if (tmp[i].value === v) {
        tmp = tmp[i].children || []
        return i
      }
    }
    return 0
  })
}
// [1,1,2] 寻找出[]
function getInnerValueByIndex (range: any[] = [], value: any[] = []): string[] {
  let tmp = range
  return value.map(v => {
    const current = tmp[v].value
    tmp = tmp[v].children
    return current
  })
}
// column = 1 value = ['无脊柱动物', '扁性动物', '吸血虫'] 根据column 和value 获取到当前列变动选择的值所在当前列的索引
function getColumnIndexByValue (range: any[] = [], column: number, value: any[] = []): number {
  let curRange = range
  let changeIndex = 0
  let tmpRange: any[] = []
  value.map((item, index) => {
    if (column === index) {
      curRange.map((ritem, rindex) => {
        if (ritem.value === item) {
          changeIndex = rindex
        }
        return ritem
      })
    } else {
      curRange.map((citem, cindex) => {
        if (citem.value === item) {
          tmpRange = citem.children
        }
        return citem
      })
      curRange = tmpRange
    }
    return item
  })
  return changeIndex
}

const _MultiSelectorPicker = forwardRef<HandlerRef<View, MultiSelectorProps>, MultiSelectorProps>((props: MultiSelectorProps, ref): React.JSX.Element => {
  const { range, value, disabled, bindchange, bindcancel, children, bindcolumnchange } = props
  const formatRange = formatRangeFun(range, props['range-key'])
  const initValue = getInnerValueByIndex(formatRange, value)
  // 选中的索引值
  const [selected, setSelected] = useState(initValue)
  // range数据源
  const [data, setData] = useState(formatRange || [])
  // 存储layout布局信息
  const layoutRef = useRef({})
  const { nodeRef: viewRef } = useNodesRef<View, MultiSelectorProps>(props, ref, {
  })

  useEffect(() => {
    if (range) {
      const newFormatRange = formatRangeFun(range, props['range-key'])
      setData(newFormatRange)
    }
    const newValue = getInnerValueByIndex(formatRange, value)
    value && setSelected(newValue)
  }, [range, value])

  const onChange = (value: PickerValue[]) => {
    // e.detail.value 都是索引multi
    const strIndex = getIndexByValues(data, value)
    bindchange && bindchange({
      detail: {
        value: strIndex
      }
    })
  }

  const onPickerChange = (value: PickerValue[], column: number) => {
    // onPickerChange--- ["无脊柱动物", "节肢动物", "吸血虫"] 1  拿着column
    const changeIndex = getColumnIndexByValue(data, column, value)
    bindcolumnchange && bindcolumnchange(changeIndex, column)
  }

  const onElementLayout = () => {
    viewRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      props.getInnerLayout && props.getInnerLayout(layoutRef)
    })
  }

  const antPickerProps = {
    data,
    value: selected,
    cols: range.length,
    defaultValue: initValue,
    disabled,
    itemHeight: 40,
    onChange,
    onDismiss: bindcancel && bindcancel,
    onPickerChange: onPickerChange
  } as any

  const touchProps = {
    onLayout: onElementLayout,
    ref: viewRef
  }

  return (<Picker {...antPickerProps}>
      <TouchableWithoutFeedback>
        <View {...touchProps}>
          {children}
        </View>
      </TouchableWithoutFeedback>
    </Picker>
  )
})

_MultiSelectorPicker.displayName = 'mpx-picker-multiselector'

export default _MultiSelectorPicker
