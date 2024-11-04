import { View, TouchableWithoutFeedback } from 'react-native'
// import { Picker, any } from '@ant-design/react-native'
import { regionData } from './regionData'
import React, { forwardRef, useState, useRef } from 'react'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数
import { RegionProps, RegionObj, LayoutType } from './type'

function formateRegionData (clObj: RegionObj[] = [], customItem?: string, depth = 2): any[] {
  const l = depth
  // 'PickerData[]' is not assignable to type 'PickerColumn | PickerColumn[]'.
  // const obj: any[] = []
  const obj: any[] = []
  if (customItem) {
    const objClone: any = {
      value: customItem,
      label: customItem,
      children: []
    }
    const panding = { ...objClone }
    let loop = panding
    while (depth-- > 0) {
      loop.children = [{ ...objClone }]
      loop = loop.children[0] as any
    }
    obj.push(panding as any)
  }
  for (let i = 0; i < clObj.length; i++) {
    const region: any = {
      value: clObj[i].value,
      label: clObj[i].value
    }
    if (clObj[i].children) {
      region.children = formateRegionData(clObj[i].children, customItem, l - 1)
    }
    obj.push(region)
  }
  return obj
}

const _RegionPicker = forwardRef<HandlerRef<View, RegionProps>, RegionProps>((props: RegionProps, ref): React.JSX.Element => {
  const { children, value, bindchange, bindcancel, disabled } = props
  const formatRegionData = formateRegionData(regionData, props['custom-item'])

  const [regionvalue, setRegionValue] = useState(value)
  // 存储layout布局信息
  const layoutRef = useRef({})
  const viewRef = useRef<View>(null)
  useNodesRef<View, RegionProps>(props, ref, viewRef, {
  })

  const onChange = (value: string[]): void => {
    // 通过 value 查找 code
    let tmp: RegionObj[] = regionData
    const postcode: (string | undefined)[] = []
    const code = value.map((item) => {
      for (let i = 0; i < tmp.length; i++) {
        if (tmp[i].value === item) {
          const code = tmp[i].code
          postcode.push(tmp[i].postcode)
          tmp = tmp[i].children || []
          return code
        }
      }
      return item
    }).filter(code => !!code)
    const detail: Record<string, any> = { value, code }
    if (postcode[2]) detail.postcode = postcode[2]
    setRegionValue(value)
    bindchange && bindchange({
      detail
    })
  }

  const onElementLayout = (layout: LayoutType) => {
    viewRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      props.getInnerLayout && props.getInnerLayout(layoutRef)
    })
  }

  const onDismiss = (): void => {
    bindcancel && bindcancel()
  }

  const regionProps = {
    data: formatRegionData,
    value: regionvalue,
    onChange,
    disabled,
    onDismiss
  }

  const touchProps = {
    onLayout: onElementLayout,
    ref: viewRef
  }

  return (
    <>
      <TouchableWithoutFeedback>
        <View {...touchProps}>{children}</View>
      </TouchableWithoutFeedback>
    </>
  )
})

_RegionPicker.displayName = 'mpx-picker-region'
export default _RegionPicker
