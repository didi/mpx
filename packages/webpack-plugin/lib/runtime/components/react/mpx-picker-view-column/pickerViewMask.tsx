import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

type MaskProps = {
  itemHeight: number
  maskContainerStyle?: StyleProp<ViewStyle>
}

const _PickerViewMask = ({
  itemHeight,
  maskContainerStyle
}: MaskProps) => {
  return (
    <View style={[styles.maskContainer, maskContainerStyle]} pointerEvents={'none'}>
      <LinearGradient colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0.5)']} style={{ flex: 1 }} />
      <View style={{ height: itemHeight }} />
      <LinearGradient colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,1)']} style={{ flex: 1 }} />
    </View>
  )
}
const styles = StyleSheet.create({
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100
  }
})

_PickerViewMask.displayName = 'MpxPickerViewMask'
export default _PickerViewMask
