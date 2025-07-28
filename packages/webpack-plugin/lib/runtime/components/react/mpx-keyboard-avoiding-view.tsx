import React, { ReactNode, useContext, useEffect } from 'react'
import { DimensionValue, EmitterSubscription, Keyboard, View, ViewStyle, NativeSyntheticEvent, NativeTouchEvent } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { KeyboardAvoidContext } from './context'
import { isIOS } from './utils'

type KeyboardAvoidViewProps = {
  children?: ReactNode
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
}

const KeyboardAvoidingView = ({ children, style, contentContainerStyle }: KeyboardAvoidViewProps) => {
  const duration = isIOS ? 250 : 300
  const easing = isIOS ? Easing.inOut(Easing.ease) : Easing.out(Easing.quad)

  const offset = useSharedValue(0)
  const basic = useSharedValue('auto')
  const keyboardAvoid = useContext(KeyboardAvoidContext)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -offset.value }],
    flexBasis: basic.value as DimensionValue
  }))

  const resetKeyboard = () => {
    if (keyboardAvoid?.current) {
      const inputRef = keyboardAvoid.current.ref?.current
      if (inputRef && inputRef.isFocused()) {
        // 修复 Android 点击键盘收起按钮时当前 input 没触发失焦的问题
        inputRef.blur()
      }
      keyboardAvoid.current = null
    }
    offset.value = withTiming(0, { duration, easing })
    basic.value = 'auto'
  }

  const onTouchEnd = ({ nativeEvent }: NativeSyntheticEvent<NativeTouchEvent & { origin?: string }>) => {
    if (nativeEvent.origin !== 'input') {
      Keyboard.isVisible() && Keyboard.dismiss()
    }
  }

  useEffect(() => {
    let subscriptions: EmitterSubscription[] = []

    if (isIOS) {
      subscriptions = [
        Keyboard.addListener('keyboardWillShow', (evt: any) => {
          if (!keyboardAvoid?.current) return
          const { endCoordinates } = evt
          const { ref, cursorSpacing = 0, adjustPosition, onKeyboardShow } = keyboardAvoid.current
          keyboardAvoid.current.keyboardHeight = endCoordinates.height
          onKeyboardShow?.()
          if (adjustPosition) {
            setTimeout(() => {
              ref?.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                const aboveOffset = offset.value + pageY + height - endCoordinates.screenY
                const aboveValue = -aboveOffset >= cursorSpacing ? 0 : aboveOffset + cursorSpacing
                const belowValue = Math.min(endCoordinates.height, aboveOffset + cursorSpacing)
                const value = aboveOffset > 0 ? belowValue : aboveValue
                offset.value = withTiming(value, { duration, easing }, (finished) => {
                  if (finished) {
                    // Set flexBasic after animation to trigger re-layout and reset layout information
                    basic.value = '99.99%'
                  }
                })
              })
            })
          }
        }),
        Keyboard.addListener('keyboardWillHide', resetKeyboard)
      ]
    } else {
      subscriptions = [
        Keyboard.addListener('keyboardDidShow', (evt: any) => {
          if (!keyboardAvoid?.current) return
          const { endCoordinates } = evt
          const { ref, cursorSpacing = 0, adjustPosition, onKeyboardShow } = keyboardAvoid.current
          keyboardAvoid.current.keyboardHeight = endCoordinates.height
          onKeyboardShow?.()
          if (adjustPosition) {
            ref?.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
              const aboveOffset = pageY + height - endCoordinates.screenY
              const belowOffset = endCoordinates.height - aboveOffset
              const aboveValue = -aboveOffset >= cursorSpacing ? 0 : aboveOffset + cursorSpacing
              const belowValue = Math.min(belowOffset, cursorSpacing)
              const value = aboveOffset > 0 ? belowValue : aboveValue
              offset.value = withTiming(value, { duration, easing }, (finished) => {
                if (finished) {
                  // Set flexBasic after animation to trigger re-layout and reset layout information
                  basic.value = '99.99%'
                }
              })
            })
          }
        }),
        Keyboard.addListener('keyboardDidHide', resetKeyboard)
      ]
    }

    return () => {
      subscriptions.forEach(subscription => subscription.remove())
    }
  }, [keyboardAvoid])

  return (
    <View style={style} onTouchEnd={onTouchEnd} onTouchMove={onTouchEnd}>
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

KeyboardAvoidingView.displayName = 'MpxKeyboardAvoidingView'

export default KeyboardAvoidingView
