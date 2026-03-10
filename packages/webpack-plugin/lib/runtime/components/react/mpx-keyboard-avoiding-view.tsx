/* eslint-disable space-before-function-paren */
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
  const keybaordHandleTimerRef = useRef<NodeJS.Timeout | null>(null)

  const animatedStyle = useAnimatedStyle(() => ({
    // translate/position top+ overflow hidden 在 android 上时因为键盘顶起让页面高度变小，同时元素位置上移
    // 此时最底部的区域是超出了页面高度的，hidden生效就被隐藏掉，因此需要 android 配置聚焦时禁用高度缩小
    // margin-top 因为在 react-native 上和 flex 1 同时存在时，负值只会让容器高度整体变高，不会让元素上移
    transform: [{ translateY: -offset.value }],
    flexBasis: basic.value as DimensionValue
  }))

  const resetKeyboard = () => {
    if (!isShow.current) {
      return
    }

    isShow.current = false

    if (keyboardAvoid?.current) {
      const inputRef = keyboardAvoid.current.ref?.current
      if (inputRef && inputRef.isFocused() && !keyboardAvoid.current.readyToShow) {
        // 修复 Android 点击键盘收起按钮时当前 input 没触发失焦的问题
        // keyboardAvoid.current.readyToShow = true 表示聚焦到了新的输入框，不需要手动触发失焦
        inputRef.blur()
      }
      if (!keyboardAvoid.current.onKeyboardShow) {
        // 修复部分 Android 机型可能时序问题：当从 input 已聚焦状态，聚焦到另一个 input 时，可能时序：
        // - 新的 Input `onTouchStart` -> 新的 Input `onFocus` -> 旧输入框键盘 `keyboardDidHide` -> 新输入框键盘 `keyboardDidShow`
        // - 此时 keyboardAvoid.current 如果清空 null，会导致新输入框键盘 `keyboardDidShow` 回调 keybaordAvoding 执行失败。
        // 修复方案：
        // 如果出现时序问题，那么新的 Input `onFocus` 会更早执行，那么 `keyboardAvoid.current.onKeyboardShow` 存在，
        // 那么不应该重置为 null，反之，说明时正常情况，应当重置为 null。
        keyboardAvoid.current = null
      }
    }

    cancelAnimation(offset)
    offset.value = withTiming(0, { duration, easing })
    basic.value = 'auto'
  }

  const onTouchEnd = ({ nativeEvent }: NativeSyntheticEvent<NativeTouchEvent & { origin?: string }>) => {
    if (nativeEvent.origin !== 'input') {
      if (keyboardAvoid?.current?.holdKeyboard) {
        return
      }
      Keyboard.isVisible() && Keyboard.dismiss()
    }
  }

  useEffect(() => {
    let subscriptions: EmitterSubscription[] = []

    function keybaordAvoding(evt: any) {
      if (keyboardAvoid?.current?.readyToShow) {
        // 重置标记位
        keyboardAvoid.current.readyToShow = false
      }
      if (!keyboardAvoid?.current) {
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
                const aboveOffset = pageY + height - endCoordinates.screenY
                const belowOffset = endCoordinates.height - aboveOffset
                const aboveValue = -aboveOffset >= cursorSpacing ? 0 : aboveOffset + cursorSpacing
                const belowValue = Math.min(belowOffset, cursorSpacing)
                return aboveOffset > 0 ? belowValue : aboveValue
              }

              const aboveOffset = offset.value + pageY + height - endCoordinates.screenY
              const aboveValue = -aboveOffset >= cursorSpacing ? 0 : aboveOffset + cursorSpacing
              const belowValue = Math.min(endCoordinates.height, aboveOffset + cursorSpacing)
              return aboveOffset > 0 ? belowValue : aboveValue
            }

            cancelAnimation(offset)
            offset.value = withTiming(calculateOffset(), { duration, easing }, finished => {
              if (finished) {
                // Set flexBasic after animation to trigger re-layout and reset layout information
                basic.value = '99.99%'
              }
            })
          })
        }
        ;(isIOS ? () => setTimeout(callback) : callback)()
      }
    }

    if (isIOS) {
      subscriptions = [
        Keyboard.addListener('keyboardWillShow', (evt: any) => {
          if (keybaordHandleTimerRef.current) {
            clearTimeout(keybaordHandleTimerRef.current)
          }
          // iphone 在input聚焦时长按滑动后会导致 show 事件先于 focus 事件发生，因此等一下，等 focus 先触发拿到 input，避免键盘出现但input没顶上去
          keybaordHandleTimerRef.current = setTimeout(() => keybaordAvoding(evt), 32)
        }),
        Keyboard.addListener('keyboardWillHide', resetKeyboard)
      ]
    } else {
      subscriptions = [Keyboard.addListener('keyboardDidShow', keybaordAvoding), Keyboard.addListener('keyboardDidHide', resetKeyboard)]
    }

    return () => {
      subscriptions.forEach(subscription => subscription.remove())
      keybaordHandleTimerRef.current && clearTimeout(keybaordHandleTimerRef.current)
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
