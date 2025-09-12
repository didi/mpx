import React, { ReactNode, useContext, useEffect, useRef } from 'react'
import { DimensionValue, EmitterSubscription, Keyboard, View, ViewStyle, NativeSyntheticEvent, NativeTouchEvent } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, cancelAnimation } from 'react-native-reanimated'
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

  // fix: 某些特殊机型下隐藏键盘可能会先触发一次 keyboardWillShow，
  // 比如机型 iPhone 11 Pro，可能会导致显隐动画冲突
  // 因此增加状态标记 + clearTimeout + cancelAnimation 来优化
  const isShow = useRef<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -offset.value }],
    flexBasis: basic.value as DimensionValue
  }))

  const resetKeyboard = () => {
    if (!isShow.current) {
      return
    }

    isShow.current = false
    timerRef.current && clearTimeout(timerRef.current)

    if (keyboardAvoid?.current) {
      keyboardAvoid.current = null
    }

    cancelAnimation(offset)
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
          if (!keyboardAvoid?.current || isShow.current) {
            return
          }

          isShow.current = true
          timerRef.current && clearTimeout(timerRef.current)

          const { endCoordinates } = evt
          const { ref, cursorSpacing = 0 } = keyboardAvoid.current

          timerRef.current = setTimeout(() => {
            ref?.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
              const aboveOffset = offset.value + pageY + height - endCoordinates.screenY
              const aboveValue = -aboveOffset >= cursorSpacing ? 0 : aboveOffset + cursorSpacing
              const belowValue = Math.min(endCoordinates.height, aboveOffset + cursorSpacing)
              const value = aboveOffset > 0 ? belowValue : aboveValue
              cancelAnimation(offset)
              offset.value = withTiming(value, { duration, easing }, (finished) => {
                if (finished) {
                  // Set flexBasic after animation to trigger re-layout and reset layout information
                  basic.value = '99.99%'
                }
              })
            })
          })
        }),
        Keyboard.addListener('keyboardWillHide', resetKeyboard)
      ]
    } else {
      subscriptions = [
        Keyboard.addListener('keyboardDidShow', (evt: any) => {
          if (!keyboardAvoid?.current || isShow.current) {
            return
          }

          isShow.current = true

          const { endCoordinates } = evt
          const { ref, cursorSpacing = 0 } = keyboardAvoid.current

          ref?.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            const aboveOffset = pageY + height - endCoordinates.screenY
            const belowOffset = endCoordinates.height - aboveOffset
            const aboveValue = -aboveOffset >= cursorSpacing ? 0 : aboveOffset + cursorSpacing
            const belowValue = Math.min(belowOffset, cursorSpacing)
            const value = aboveOffset > 0 ? belowValue : aboveValue
            cancelAnimation(offset)
            offset.value = withTiming(value, { duration, easing }, (finished) => {
              if (finished) {
                // Set flexBasic after animation to trigger re-layout and reset layout information
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
      timerRef.current && clearTimeout(timerRef.current)
    }
  }, [keyboardAvoid])

  return (
    <View style={style} onTouchEnd={onTouchEnd}>
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
