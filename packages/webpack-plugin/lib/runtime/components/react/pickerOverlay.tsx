import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

type OverlayProps = {
  itemHeight: number
  overlayItemStyle?: Record<string, any>
  overlayContainerStyle?: ViewStyle
}

const transPx2Number = (value?: string | number) => {
  if (typeof value === 'string') {
    const match = value.toString().match(/\d+/g)
    if (match) {
      return +match[0]
    }
  }
  return value
}

const Overlay = ({ itemHeight, overlayItemStyle, overlayContainerStyle }: OverlayProps) => {
  let { width, borderRadius, ...restStyle } = overlayItemStyle || {}
  width = transPx2Number(width)
  borderRadius = transPx2Number(borderRadius)
  return (
    <View style={[styles.overlayContainer, overlayContainerStyle]} pointerEvents={'none'}>
      <View
        style={[styles.selection, { height: itemHeight, width, borderRadius }, restStyle]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignSelf: 'stretch'
  }
})

export default React.memo(Overlay)
