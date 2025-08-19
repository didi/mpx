import { PixelRatio, Dimensions } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { getFocusedNavigation } from '../../../common/js'

const getWindowInfo = function () {
  const dimensionsScreen = Dimensions.get('screen')
  const navigation = getFocusedNavigation() || {}
  const initialWindowMetricsInset = initialWindowMetrics?.insets || {}
  const navigationInsets = navigation.insets || {}
  const insets = Object.assign({}, initialWindowMetricsInset, navigationInsets)
  let safeArea = {}
  const { top = 0, left = 0, right = 0 } = insets
  const { bottom = 0 } = initialWindowMetricsInset
  const screenHeight = __mpx_mode__ === 'ios' ? parseInt(dimensionsScreen.height) : parseInt(dimensionsScreen.height - bottom) // 解决安卓开启屏幕内三建导航安卓把安全区计算进去后产生的影响
  const screenWidth = __mpx_mode__ === 'ios' ? parseInt(dimensionsScreen.width) : parseInt(dimensionsScreen.width - right)
  const layout = parseInt(navigation.layout) || {}
  const layoutHeight = parseInt(layout.height) || 0
  const layoutWidth = parseInt(layout.width) || 0
  const windowHeight = parseInt(layoutHeight) || parseInt(screenHeight)
  try {
    safeArea = {
      left,
      right: screenWidth - right,
      top: parseInt(top),
      bottom: parseInt(screenHeight - bottom),
      height: parseInt(screenHeight - top - bottom),
      width: parseInt(screenWidth - left - right)
    }
  } catch (error) {
  }
  const result = {
    pixelRatio: PixelRatio.get(),
    windowWidth: layoutWidth || screenWidth,
    windowHeight, // 取不到layout的时候有个兜底
    screenWidth: screenWidth,
    screenHeight: screenHeight,
    screenTop: parseInt(screenHeight - windowHeight),
    statusBarHeight: parseInt(safeArea.top),
    safeArea
  }
  return result
}

const getLaunchOptionsSync = function () {
  return global.__mpxLaunchOptions || {}
}

const getEnterOptionsSync = function () {
  return global.__mpxEnterOptions || {}
}

export {
  getWindowInfo,
  getLaunchOptionsSync,
  getEnterOptionsSync
}
