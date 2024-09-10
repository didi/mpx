import { View } from 'react-native'
import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { PickerView } from '@ant-design/react-native'
import useInnerProps from './getInnerListeners'
import { getCustomEvent } from './getInnerListeners'
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
}

const _PickerView = forwardRef<HandlerRef<View, PickerViewProps>, PickerViewProps>((props: PickerViewProps, ref) => {
  const { children, ...restProps } = props
  const layoutRef = useRef({})
  const { nodeRef } = useNodesRef(props, ref, {})
  const [value, setValue] = useState(props.value)
  useEffect(() => {
    // 确认这个是变化的props变化的时候才执行，还是初始化的时候就执行
    setValue(props.value)
  }, [props.value]);

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }
  const innerProps = useInnerProps(props, {}, [], { layoutRef })


  const onChange = (val: Array<number>): void => {
    const eventData = getCustomEvent('change', {}, { detail: {value: val, source: 'touch' }, layoutRef: layoutRef })
    setValue(val)
    props.bindchange && props.bindchange(eventData)
  }

  const joinString = (data: string | any[] | React.ReactElement): string => {
    return (Array.isArray(data) ? data : [data]).join('')
  }

  const getLabelFromChildren = (child: React.ReactElement): string => {
    return child.props && child.props.children ? getLabelFromChildren(child.props.children) : joinString(child)
  }

  const handleChildren = (children: React.ReactNode[]): any[] => {
    return children.map((child: any, index: number) => {
      return {
        label: getLabelFromChildren(child),
        value: index
      }
    })
  }

  const getDataFromChildren = (children: React.ReactNode): any[] => {
    return (Array.isArray(children) ? children : [children]).map((child: any) => {
      return handleChildren(child.props && child.props.children ? child.props.children : [child])
    })
  }

  const columns = Array.isArray(children) ? children.length : 1
  const originData = getDataFromChildren(children)
  // 子节点默认的序号，这里是更新默认值的
  const subChildLength = originData.map((item) => {
    return item.length
  })
  const defaultValue = (props.value || []).map((item, index) => {
    if (item > subChildLength[index]) {
      return subChildLength[index] - 1
    } else {
      return item
    }
  })

  return (
    <PickerView
    {...restProps}
    cols={columns}
    // 默认选中项
    defaultValue={defaultValue}
    // 内部维护选中项
    value={value}
    // data数据源column
    data={originData}
    onChange={onChange}
    cascade={false}/>
  )
})

_PickerView.displayName = 'mpx-picker-view';

export default _PickerView
