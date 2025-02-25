import { StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing
} from 'react-native-reanimated'
import { getWindowInfo } from '@mpxjs/api-proxy'
import { useUpdateEffect } from '../utils'

export interface PopupBaseProps {
  children?: React.ReactNode
  hide?: () => void
  contentHeight?: number
  visible?: boolean
}

const windowInfo = getWindowInfo()
const bottom = windowInfo.screenHeight - windowInfo.safeArea.bottom
const styles = StyleSheet.create({
  mask: {
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'absolute',
    zIndex: 1000
  },
  content: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: bottom
  },
  buttonStyle: {
    fontSize: 18,
    paddingTop: 10,
    paddingBottom: 10
  }
})

const MASK_ON = 1 as const
const MASK_OFF = 0 as const
const MOVEOUT_HEIGHT = 330 as const

/**
 * 类似微信 picker 弹窗的动画效果都可以复用此类容器
 * 其他特定类型的弹窗容器组件可以在此基础上封装，或者扩展实现
 */
const PopupBase = (props: PopupBaseProps = {}) => {
  const {
    children,
    hide = () => null,
    contentHeight = MOVEOUT_HEIGHT,
    visible = false
  } = props
  const fade = useSharedValue<number>(MASK_OFF)
  const slide = useSharedValue<number>(contentHeight)

  const animatedStylesMask = useAnimatedStyle(() => ({
    opacity: fade.value
  }))

  const animatedStylesContent = useAnimatedStyle(() => ({
    transform: [{ translateY: slide.value }]
  }))

  const showAimation = () => {
    fade.value = withTiming(MASK_ON, {
      easing: Easing.inOut(Easing.poly(3)),
      duration: 300
    })
    slide.value = withTiming(0, {
      easing: Easing.out(Easing.poly(3)),
      duration: 300
    })
  }

  const hideAnimation = () => {
    fade.value = withTiming(MASK_OFF, {
      easing: Easing.inOut(Easing.poly(3)),
      duration: 300
    })
    slide.value = withTiming(
      contentHeight,
      {
        easing: Easing.inOut(Easing.poly(3)),
        duration: 300
      }
    )
  }

  useUpdateEffect(() => {
    if (visible) {
      showAimation()
    } else {
      hideAnimation()
    }
  }, [visible])

  const preventMaskClick = (e: any) => {
    e.stopPropagation()
  }

  return (
    <Animated.View
      onTouchEnd={hide}
      style={[
        styles.mask,
        animatedStylesMask
      ]}
    >
      <Animated.View
        style={[styles.content, animatedStylesContent]}
        onTouchEnd={preventMaskClick}
      >
        {children}
      </Animated.View>
    </Animated.View>
  )
}

PopupBase.displayName = 'MpxPopupBase'
export default PopupBase
