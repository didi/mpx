import React, { ReactNode, useContext, useEffect } from 'react'
import { DimensionValue, EmitterSubscription, Keyboard, Platform, View, ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { KeyboardAvoidContext } from './context'
import { extendObject } from './utils'

type KeyboardAvoidViewProps = {
  children?: ReactNode
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
}

const KeyboardAvoidingView = ({ children, style, contentContainerStyle }: KeyboardAvoidViewProps) => {
  const isIOS = Platform.OS === 'ios'
  const duration = isIOS ? 250 : 300
  const easing = isIOS ? Easing.inOut(Easing.ease) : Easing.out(Easing.quad)

  const offset = useSharedValue(0)
  const basic = useSharedValue('auto')
  const keyboardAvoid = useContext(KeyboardAvoidContext)

  const animatedStyle = useAnimatedStyle(() => {
    return Object.assign(
      {
        transform: [{ translateY: -offset.value }]
      },
      isIOS ? {} : { flexBasis: basic.value as DimensionValue }
    )
  })

  const resetKeyboard = () => {
    keyboardAvoid?.current && extendObject(keyboardAvoid.current, {
      cursorSpacing: 0,
      ref: null
    })
    offset.value = withTiming(0, { duration, easing })
    basic.value = 'auto'
  }

  useEffect(() => {
    let subscriptions: EmitterSubscription[] = []

    if (isIOS) {
      subscriptions = [
        Keyboard.addListener('keyboardWillShow', (evt: any) => {
          if (!keyboardAvoid?.current) return
          const { endCoordinates } = evt
          const { ref, cursorSpacing = 0 } = keyboardAvoid.current
          setTimeout(() => {
            ref?.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
              const aboveOffset = pageY + height - endCoordinates.screenY
              const aboveValue = -aboveOffset >= cursorSpacing ? 0 : aboveOffset + cursorSpacing
              const belowValue = Math.min(endCoordinates.height, aboveOffset + cursorSpacing)
              const value = aboveOffset > 0 ? belowValue : aboveValue
              offset.value = withTiming(value, { duration, easing })
            })
          })
        }),
        Keyboard.addListener('keyboardWillHide', resetKeyboard)
      ]
    } else {
      subscriptions = [
        Keyboard.addListener('keyboardDidShow', (evt: any) => {
          if (!keyboardAvoid?.current) return
          const { endCoordinates } = evt
          const { ref, cursorSpacing = 0 } = keyboardAvoid.current
          ref?.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            const aboveOffset = pageY + height - endCoordinates.screenY
            const belowOffset = endCoordinates.height - aboveOffset
            const aboveValue = -aboveOffset >= cursorSpacing ? 0 : aboveOffset + cursorSpacing
            const belowValue = Math.min(belowOffset, cursorSpacing)
            const value = aboveOffset > 0 ? belowValue : aboveValue
            offset.value = withTiming(value, { duration, easing }, (finished) => {
              if (finished) {
                /**
                 * In the Android environment, the layout information is not synchronized after the animation,
                 * which results in the inability to correctly trigger element events.
                 * Here, we utilize flexBasic to proactively trigger a re-layout
                 */
                basic.value = '99.99%'
              }
            })
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
