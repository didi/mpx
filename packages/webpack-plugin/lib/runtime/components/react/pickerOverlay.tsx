import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

type OverlayProps = {
  itemHeight: number
  overlayItemStyle?: ViewStyle
  overlayContainerStyle?: ViewStyle
}

const Overlay = ({ itemHeight, overlayItemStyle, overlayContainerStyle }: OverlayProps) => {
  return (
    <View style={[styles.overlayContainer, overlayContainerStyle]} pointerEvents={'none'}>
      <View style={[styles.selection, { height: itemHeight }, overlayItemStyle]} />
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
