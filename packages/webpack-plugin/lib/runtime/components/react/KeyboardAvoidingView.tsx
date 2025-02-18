import React, { ReactNode, useContext, useEffect } from 'react'
import { Keyboard, StyleSheet, View, ViewStyle } from 'react-native'
import { Easing, ReduceMotion, useSharedValue, withTiming } from 'react-native-reanimated'
import { KeyboardAvoidContext } from './context'

type KeyboardAvoidViewProps = {
  children?: ReactNode
  style?: ViewStyle & Record<string, any>
  contentContainerStyle?: ViewStyle & Record<string, any>
}

const KeyboardAvoidingView = ({ children, style, contentContainerStyle }: KeyboardAvoidViewProps) => {
  const offset = useSharedValue(0)
  const inputRef = useContext(KeyboardAvoidContext)

  useEffect(() => {
    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', (evt: any) => {
      offset.value = withTiming(0)
    })
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (evt: any) => {
      const { endCoordinates } = evt
      console.log('input ref: ', inputRef)
      if (inputRef?.current) {
        inputRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          console.log('input ref: ', x, y, width, height, pageX, pageY)
          const offsetSize = pageY + height - endCoordinates.screenY
          if (offsetSize > 0) {
            offset.value = withTiming(-offsetSize, {
              duration: 250,
              easing: Easing.inOut(Easing.quad),
              reduceMotion: ReduceMotion.System
            })
          }
        })
      }
    })
    return () => {
      keyboardWillHide.remove()
      keyboardWillShow.remove()
    }
  }, [])

  return (
    <View style={[styles.container, style]}>
      <View style={[
        contentContainerStyle,
        {
          transform: [{
            translateY: offset.value
          }]
        }
      ]}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

export default KeyboardAvoidingView
