import React, { ReactNode, useContext, useEffect, useRef } from 'react'
import { DimensionValue, EmitterSubscription, Keyboard, View, ViewStyle, NativeSyntheticEvent, NativeTouchEvent } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, cancelAnimation } from 'react-native-reanimated'
import { KeyboardAvoidContext } from './context'
import { isAndroid, isIOS } from './utils'

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
  // 因此增加状态标记 + cancelAnimation 来优化
  const isShow = useRef<boolean>(false)

  const animatedStyle = useAnimatedStyle(() => ({
    // translate/position top可能会导致底部渲染区域缺失
    marginTop: -offset.value,
    flexBasis: basic.value as DimensionValue
  }))

  const resetKeyboard = () => {
    if (!isShow.current) {
      return
    }

    isShow.current = false

    if (keyboardAvoid?.current) {
      const inputRef = keyboardAvoid.current.ref?.current
      if (inputRef && inputRef.isFocused()) {
        // 修复 Android 点击键盘收起按钮时当前 input 没触发失焦的问题
        inputRef.blur()
      }
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

    function keybaordAvoding(evt: any) {
      if (!keyboardAvoid?.current || isShow.current) {
        return
      }

      isShow.current = true

      const { endCoordinates } = evt
      const { ref, cursorSpacing = 0, adjustPosition, onKeyboardShow } = keyboardAvoid.current
      keyboardAvoid.current.keyboardHeight = endCoordinates.height
      onKeyboardShow?.()
      if (adjustPosition) {
        // 默认沿用旧版本逻辑，在 android 原生关闭键盘避让的情况下应该将该配置设置为 false，走 mpx 的键盘避让逻辑，否则bundle内的所有input都会无法避让键盘
        const enableNativeKeyboardAvoiding = mpxGlobal?.__mpx?.config?.rnConfig?.enableNativeKeyboardAvoiding ?? true
        const callback = () => {
          ref?.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            function calculateOffset() {
              // enableNativeKeyboardAvoding 默认开启
              if (enableNativeKeyboardAvoiding && isAndroid) {
                const aboveOffset = offset.value + pageY + height - endCoordinates.screenY;
                const aboveValue = -aboveOffset >= cursorSpacing ? 0 : aboveOffset + cursorSpacing;
                const belowValue = Math.min(endCoordinates.height, aboveOffset + cursorSpacing);
                return aboveOffset > 0 ? belowValue : aboveValue;
              }

              const aboveOffset = offset.value + pageY + height - endCoordinates.screenY;
              const aboveValue = -aboveOffset >= cursorSpacing ? 0 : aboveOffset + cursorSpacing;
              const belowValue = Math.min(endCoordinates.height, aboveOffset + cursorSpacing);
              return aboveOffset > 0 ? belowValue : aboveValue;
            }

            cancelAnimation(offset)
            offset.value = withTiming(calculateOffset(), { duration, easing }, finished => {
              if (finished) {
                // Set flexBasic after animation to trigger re-layout and reset layout information
                basic.value = '99.99%'
              }
            })
          })
        };
        (isIOS ? () => setTimeout(callback) : callback)();
      }
    }

    if (isIOS) {
      subscriptions = [
        Keyboard.addListener('keyboardWillShow', keybaordAvoding),
        Keyboard.addListener('keyboardWillHide', resetKeyboard)
      ]
    } else {
      subscriptions = [
        Keyboard.addListener('keyboardDidShow', keybaordAvoding),
        Keyboard.addListener('keyboardDidHide', resetKeyboard)
      ]
    }

    return () => {
      subscriptions.forEach(subscription => subscription.remove())
    }
  }, [keyboardAvoid])

  return (
    <View style={style} onTouchEnd={onTouchEnd} onTouchMove={onTouchEnd}>
      <Animated.View style={[contentContainerStyle, animatedStyle]}>{children}</Animated.View>
    </View>
  )
}

KeyboardAvoidingView.displayName = 'MpxKeyboardAvoidingView'

export default KeyboardAvoidingView
