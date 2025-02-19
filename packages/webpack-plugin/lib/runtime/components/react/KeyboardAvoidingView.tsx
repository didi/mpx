import React, { ReactNode, useContext, useEffect } from 'react'
import { EmitterSubscription, Keyboard, Platform, View, ViewStyle } from 'react-native'
import Animted, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { KeyboardAvoidContext } from './context'

type KeyboardAvoidViewProps = {
  children?: ReactNode
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
}

const KeyboardAvoidingView = ({ children, style, contentContainerStyle }: KeyboardAvoidViewProps) => {
  const bottom = useSharedValue(0)
  const keyboardAvoid = useContext(KeyboardAvoidContext)

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -bottom.value }] }))

  const resetKeyboard = () => {
    keyboardAvoid && Object.assign(keyboardAvoid, {
      cursorSpacing: 0,
      ref: null
    })
    bottom.value = withTiming(0)
  }

  useEffect(() => {
    let subscriptions: EmitterSubscription[] = []

    if (Platform.OS === 'ios') {
      subscriptions = [
        Keyboard.addListener('keyboardWillShow', (evt: any) => {
          if (!keyboardAvoid) return
          const { endCoordinates } = evt
          const { ref, cursorSpacing = 0 } = keyboardAvoid
          ref?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            const aboveOffset = pageY + height - endCoordinates.screenY
            const aboveValue = -aboveOffset >= cursorSpacing ? 0 : cursorSpacing
            const belowValue = aboveOffset + cursorSpacing >= endCoordinates.height ? endCoordinates.height : aboveOffset + cursorSpacing
            const value = aboveOffset > 0 ? belowValue : aboveValue
            bottom.value = withTiming(value)
          })
        }),
        Keyboard.addListener('keyboardWillHide', resetKeyboard)
      ]
    } else {
      subscriptions = [
        Keyboard.addListener('keyboardDidShow', (evt: any) => {
          if (!keyboardAvoid) return
          const { endCoordinates } = evt
          const { ref, cursorSpacing = 0 } = keyboardAvoid
          ref?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            const aboveOffset = pageY + height - endCoordinates.screenY
            const belowOffset = endCoordinates.height - aboveOffset
            const aboveValue = -aboveOffset >= cursorSpacing ? 0 : cursorSpacing
            const belowValue = cursorSpacing >= belowOffset ? belowOffset : cursorSpacing
            const value = aboveOffset > 0 ? belowValue : aboveValue
            bottom.value = withTiming(value)
          })
        }),
        Keyboard.addListener('keyboardDidHide', resetKeyboard)
      ]
    }

    return () => {
      subscriptions.forEach(subscription => subscription.remove())
    }
  }, [keyboardAvoid])

  return (
    <View style={style}>
      <Animted.View
        style={[
          contentContainerStyle,
          animatedStyle
        ]}
      >
        {children}
      </Animted.View>
    </View>
  )
}

export default KeyboardAvoidingView
