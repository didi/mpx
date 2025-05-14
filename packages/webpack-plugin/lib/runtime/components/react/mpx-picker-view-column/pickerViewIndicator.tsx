import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

type IndicatorProps = {
  itemHeight: number
  indicatorItemStyle?: StyleProp<ViewStyle>
  indicatorContainerStyle?: StyleProp<ViewStyle>
}

const _PickerViewIndicator = ({ itemHeight, indicatorItemStyle, indicatorContainerStyle }: IndicatorProps) => {
  return (
    <View style={[styles.indicatorContainer, indicatorContainerStyle]} pointerEvents={'none'}>
      <View style={[styles.selection, { height: itemHeight }, indicatorItemStyle]} />
    </View>
  )
}

const styles = StyleSheet.create({
  indicatorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200
  },
  selection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignSelf: 'stretch'
  }
})

_PickerViewIndicator.displayName = 'MpxPickerViewIndicator'
export default _PickerViewIndicator
