import { PixelRatio, Dimensions } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { getFocusedNavigation } from '../../../common/js'

const getWindowInfo = function () {
  const dimensionsScreen = global.getDimensionsInfo?.('screen') || Dimensions.get('screen')
  const dimensionsWindow = global.getDimensionsInfo?.('window') || Dimensions.get('window')
  const navigation = getFocusedNavigation() || {}
  const initialWindowMetricsInset = initialWindowMetrics?.insets || {}
  const navigationInsets = navigation.insets || {}
  const insets = Object.assign({}, initialWindowMetricsInset, navigationInsets)
  let safeArea = {}
  const { top = 0, left = 0, bottom = 0, right = 0 } = insets
  const layout = navigation.layout || {}
  const screenHeight = __mpx_mode__ === 'ios' ? dimensionsScreen.height : dimensionsScreen.height - (layout.bottomVirtualHeight || 0) // 解决安卓开启屏幕内导航安卓把安全区计算进去后产生的影响
  const screenWidth = __mpx_mode__ === 'ios' ? dimensionsScreen.width : dimensionsScreen.width - right
  const windowHeight = layout.height ?? dimensionsWindow.height
  console.log('dimensionsScreen', dimensionsScreen, dimensionsWindow, initialWindowMetricsInset, insets)
  try {
    safeArea = {
      left,
      right: dimensionsWindow.width - right,
      top,
      bottom: dimensionsWindow.height - bottom + (dimensionsScreen.height > dimensionsWindow.height && __mpx_mode__ === 'android' ? top : 0),
      height: dimensionsWindow.height - (dimensionsScreen.height > dimensionsWindow.height && __mpx_mode__ === 'android' ? 0 : top) - bottom,
      width: dimensionsWindow.width - left - right
    }
  } catch (error) {
  }
  const result = {
    pixelRatio: PixelRatio.get(),
    windowWidth: layout.width ?? dimensionsWindow.width,
    windowHeight, // 取不到layout的时候有个兜底
    screenWidth: screenWidth,
    screenHeight: screenHeight,
    screenTop: screenHeight - windowHeight,
    statusBarHeight: safeArea.top,
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
