import React, { ReactNode, useContext, useEffect } from 'react'
import { Keyboard, View, ViewStyle } from 'react-native'
import Animted, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { KeyboardAvoidContext } from './context'

type KeyboardAvoidViewProps = {
  children?: ReactNode
  style?: ViewStyle & Record<string, any>
  contentContainerStyle?: ViewStyle & Record<string, any>
}

const KeyboardAvoidingView = ({ children, style, contentContainerStyle }: KeyboardAvoidViewProps) => {
  const bottom = useSharedValue(0)
  const keyboardAvoid = useContext(KeyboardAvoidContext)

  const animatedStyle = useAnimatedStyle(() => ({
    bottom: bottom.value
  }))

  useEffect(() => {
    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', (evt: any) => {
      keyboardAvoid && Object.assign(keyboardAvoid, {
        cursorSpacing: 0,
        ref: null
      })
      bottom.value = withTiming(0)
    })
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (evt: any) => {
      if (!keyboardAvoid) return
      const { endCoordinates } = evt
      const { ref, cursorSpacing = 0 } = keyboardAvoid
      if (ref) {
        ref.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          const offsetSize = bottom.value + pageY + height - endCoordinates.screenY
          const space = offsetSize > 0 ? offsetSize + cursorSpacing : -offsetSize >= cursorSpacing ? 0 : cursorSpacing
          bottom.value = withTiming(space)
        })
      }
    })

    return () => {
      keyboardWillHide.remove()
      keyboardWillShow.remove()
    }
  }, [keyboardAvoid])

  return (
    <View style={style}>
      <Animted.View style={[
        contentContainerStyle,
        animatedStyle
      ]}>
        {children}
      </Animted.View>
    </View>
  )
}

export default KeyboardAvoidingView
