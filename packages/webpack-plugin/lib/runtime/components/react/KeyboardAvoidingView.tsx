import React, { ReactNode, useContext, useEffect } from 'react'
import { EmitterSubscription, Keyboard, Platform, View, ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { KeyboardAvoidContext, KeyboardAvoidContextValue } from './context'
import { extendObject } from './utils'

type KeyboardAvoidViewProps = {
  children?: ReactNode
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
}

const KeyboardAvoidingView = ({ children, style, contentContainerStyle }: KeyboardAvoidViewProps) => {
  const isIOS = Platform.OS === 'ios'
  const easing = isIOS ? Easing.inOut(Easing.ease) : Easing.out(Easing.quad)
  const duration = isIOS ? 250 : 300

  const offset = useSharedValue(0)
  const keyboardAvoid = useContext(KeyboardAvoidContext)

  const animatedStyle = useAnimatedStyle(() => {
    return isIOS ? { transform: [{ translateY: -offset.value }] } : { bottom: offset.value }
  })

  const resetKeyboard = () => {
    keyboardAvoid && extendObject(keyboardAvoid, {
      cursorSpacing: 0,
      ref: null
    })
    offset.value = withTiming(0, { duration, easing })
  }

  const animateOffset = (evt: any, keyboardAvoid: KeyboardAvoidContextValue | null) => {
    if (!keyboardAvoid) return
    const { endCoordinates } = evt
    const { ref, cursorSpacing = 0 } = keyboardAvoid
    setTimeout(() => {
      ref?.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const aboveOffset = pageY + height - endCoordinates.screenY
        const aboveValue = -aboveOffset >= cursorSpacing ? 0 : cursorSpacing
        const belowValue = Math.min(endCoordinates.height, aboveOffset + cursorSpacing)
        const value = aboveOffset > 0 ? belowValue : aboveValue
        offset.value = withTiming(value, { duration, easing })
      })
    })
  }

  useEffect(() => {
    let subscriptions: EmitterSubscription[] = []

    if (isIOS) {
      subscriptions = [
        Keyboard.addListener('keyboardWillShow', (evt: any) => animateOffset(evt, keyboardAvoid)),
        Keyboard.addListener('keyboardWillHide', resetKeyboard)
      ]
    } else {
      subscriptions = [
        Keyboard.addListener('keyboardDidShow', (evt: any) => animateOffset(evt, keyboardAvoid)),
        Keyboard.addListener('keyboardDidHide', resetKeyboard)
      ]
    }

    return () => {
      subscriptions.forEach(subscription => subscription.remove())
    }
  }, [keyboardAvoid])

  return (
    <View style={style}>
      <Animated.View
        style={[
          contentContainerStyle,
          animatedStyle
        ]}
      >
        {children}
      </Animated.View>
    </View>
  )
}

export default KeyboardAvoidingView
