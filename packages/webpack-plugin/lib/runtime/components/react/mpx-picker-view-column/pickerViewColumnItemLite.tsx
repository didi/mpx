import React from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import { extendObject } from '../utils'

interface PickerColumnItemProps {
  item: React.ReactElement
  index: number
  itemHeight: number
  itemWidth?: number | '100%'
  onItemLayout?: (e: LayoutChangeEvent) => void
}

const PickerViewColumnItem: React.FC<PickerColumnItemProps> = ({
  item,
  index,
  itemHeight,
  itemWidth = '100%',
  onItemLayout
}) => {
  const strKey = `picker-column-item-${index}`
  const restProps = index === 0 ? { onLayout: onItemLayout } : {}
  const itemProps = extendObject(
    {
      style: extendObject(
        { height: itemHeight, width: '100%' },
        item.props.style
      )
    },
    restProps
  )
  const realItem = React.cloneElement(item, itemProps)

  return (
    <View
      key={strKey}
      style={[
        { height: itemHeight, width: itemWidth, pointerEvents: 'none' }
      ]}
    >
      {realItem}
    </View>
  )
}

PickerViewColumnItem.displayName = 'MpxPickerViewColumnItem'
export default PickerViewColumnItem
