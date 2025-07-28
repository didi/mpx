import React, { ReactNode, useContext, useEffect } from 'react'
import { DimensionValue, EmitterSubscription, Keyboard, View, ViewStyle, NativeSyntheticEvent, NativeTouchEvent } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { getWindowInfo } from '@mpxjs/api-proxy'
import { KeyboardAvoidContext } from './context'
import { isIOS } from './utils'

type KeyboardAvoidViewProps = {
  children?: ReactNode
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
  navigation?: any
}

const KeyboardAvoidingView = ({ children, style, contentContainerStyle, navigation }: KeyboardAvoidViewProps) => {
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
      navigation.setPageConfig({
        animatedNavStyle: {
          top: withTiming(0, { duration: 100, easing: Easing.in(Easing.bezierFn(0.51, 1.18, 0.97, 0.94)) })
        }
      })
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
          // android 上键盘消失只能使用 keyboardDidHide 事件，对于需要和键盘一起改变位置的 nav 来说
          // keyboardDidHide 是比较晚的，从动画上看也并不同步，因此采用比较早的blur
          keyboardAvoid.current.blurCallbacks.push(resetKeyboard)
          keyboardAvoid.current.keyboardHeight = endCoordinates.height
          onKeyboardShow?.()
          if (adjustPosition) {
            ref?.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
              const screenHeightRatio =
              getWindowInfo().screenHeight /
              (endCoordinates.screenY + endCoordinates.height)
              const navAboveOffset = pageY + height - Math.floor(endCoordinates.screenY * screenHeightRatio)

              const aboveOffset = pageY + height - endCoordinates.screenY
              const belowOffset = endCoordinates.height - aboveOffset
              const aboveValue = -aboveOffset >= cursorSpacing ? 0 : aboveOffset + cursorSpacing
              const belowValue = Math.min(belowOffset, cursorSpacing)
              const value = aboveOffset > 0 ? belowValue : aboveValue

              navigation.setPageConfig({
                animatedNavStyle: {
                  // android 手机本身支持将页面整体上移（包含 nav 和 body）
                  // mpx-keyboard-avoiding-view 和 nav 使用 transform 时互不影响，因此这里只需要计算 android 键盘出现导致上移的高度即可
                  top: withTiming(navAboveOffset, {
                    duration: 100,
                    easing
                  })
                }
              })

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
