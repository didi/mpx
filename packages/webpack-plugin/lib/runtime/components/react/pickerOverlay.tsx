import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

type OverlayProps = {
  itemHeight: number
  overlayItemStyle?: Record<string, any>
  overlayContainerStyle?: ViewStyle
}

const Overlay = ({ itemHeight, overlayItemStyle, overlayContainerStyle }: OverlayProps) => {
  const itemWidth = overlayItemStyle?.width
  if (typeof itemWidth === 'string') {
    const match = itemWidth.match(/^(\d+)px$/)
    if (match) {
      overlayItemStyle!.width = +match[1]
    }
  }
  return (
    <View style={[styles.overlayContainer, overlayContainerStyle]} pointerEvents={'none'}>
      <View
        style={[{ height: itemHeight }, styles.selection, overlayItemStyle]}
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
