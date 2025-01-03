import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { getWindowInfo } from '@mpxjs/api-proxy'

export interface PopupBaseProps {
  children?: React.ReactNode
  remove?: () => void
}

const windowInfo = getWindowInfo()
console.log('windowInfo', windowInfo)
const bottom = windowInfo.screenHeight - windowInfo.safeArea.bottom
const styles = StyleSheet.create({
  actionActionMask: {
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'absolute',
    zIndex: 1000
  },
  actionSheetContent: {
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

/**
 * 封装的 Popup 弹窗容器组件最基础的实现，弹入和弹出动画实现和 showActionSheet 对齐
 * 其他特定类型的弹窗容器组件可以在此基础上封装，比如 PopupPicker 弹窗容器组件
 * @param props {PopupBaseProps} 弹窗配置项
 * @returns 弹窗容器组件
 */
const PopupBase = (props: PopupBaseProps = {}) => {
  const { children, remove } = props
  const offset = useSharedValue(1000)

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }]
  }))

  const slideOut = () => {
    offset.value = withTiming(1000)
  }

  offset.value = withTiming(0)

  const cancelAction = function (e: any) {
    e.stopPropagation()
    slideOut()
    remove?.()
  }

  const preventMaskClick = (e: any) => {
    e.stopPropagation()
  }

  return (
    <View onTouchEnd={cancelAction} style={styles.actionActionMask}>
      <Animated.View
        style={[styles.actionSheetContent, animatedStyles]}
        onTouchEnd={preventMaskClick}
      >
        {children}
      </Animated.View>
    </View>
  )
}

PopupBase.displayName = 'MpxPopupBase'
export default PopupBase
