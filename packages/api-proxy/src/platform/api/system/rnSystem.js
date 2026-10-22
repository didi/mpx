import { PixelRatio, Dimensions } from 'react-native'
import mpx from '@mpxjs/core'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { getFocusedNavigation } from '../../../common/js'

const getWindowInfo = function () {
  const dimensionsWindow = Dimensions.get('window')
  const dimensionsScreen = global.getDimensionsInfo?.('screen') || Dimensions.get('screen')
  const navigation = getFocusedNavigation() || {}
  const initialWindowMetricsInset = initialWindowMetrics?.insets || {}
  const navigationInsets = navigation.insets || {}
  const insets = Object.assign({}, initialWindowMetricsInset, navigationInsets)
  let safeArea = {}
  const { top = 0, left = 0, bottom = 0, right = 0 } = insets
  const layout = navigation.layout || {}
  const customLayout = mpx.config.rnConfig.customLayout?.() || {}
  const screenHeight = __mpx_mode__ === 'ios' ? dimensionsScreen.height : dimensionsScreen.height - (layout.bottomVirtualHeight || 0) // 解决安卓开启屏幕内导航安卓把安全区计算进去后产生的影响
  const screenWidth = __mpx_mode__ === 'ios' ? dimensionsScreen.width : dimensionsScreen.width - right
  const layoutHeight = layout.height || 0
  const layoutWidth = layout.width || 0
  const fallbackWindowWidth = customLayout.width || (__mpx_mode__ === 'ios' ? dimensionsWindow.width : screenWidth)
  const fallbackWindowHeight = customLayout.height || (__mpx_mode__ === 'ios' ? dimensionsWindow.height : screenHeight)
  const windowHeight = layoutHeight || fallbackWindowHeight
  try {
    safeArea = {
      left,
      right: fallbackWindowWidth - right,
      top,
      bottom: fallbackWindowHeight - bottom,
      height: fallbackWindowHeight - top - bottom,
      width: fallbackWindowWidth - left - right
    }
  } catch (error) {
  }
  const result = {
    pixelRatio: PixelRatio.get(),
    windowWidth: layoutWidth || fallbackWindowWidth,
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
