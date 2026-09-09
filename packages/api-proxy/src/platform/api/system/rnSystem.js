import { PixelRatio, Dimensions } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { getFocusedNavigation } from '../../../common/js'

const getWindowInfo = function () {
  const nativeDimensions = {
    window: Dimensions.get('window'),
    screen: Dimensions.get('screen')
  }
  const hasCustomDimensions = typeof mpxGlobal.__mpx?.config?.rnConfig?.customDimensions === 'function'
  const dimensions = hasCustomDimensions ? global.__getMpxAppDimensionsInfo() : nativeDimensions
  const dimensionsScreen = nativeDimensions.screen
  const navigation = getFocusedNavigation() || {}
  const initialWindowMetricsInset = initialWindowMetrics?.insets || {}
  const navigationInsets = navigation.insets || {}
  const insets = Object.assign({}, initialWindowMetricsInset, navigationInsets)
  let safeArea = {}
  const { top = 0, left = 0, bottom = 0, right = 0 } = insets
  const layout = navigation.layout || {}
  const screenHeight = __mpx_mode__ === 'ios' ? dimensionsScreen.height : dimensionsScreen.height - (layout.bottomVirtualHeight || 0) // 解决安卓开启屏幕内导航安卓把安全区计算进去后产生的影响
  const screenWidth = __mpx_mode__ === 'ios' ? dimensionsScreen.width : dimensionsScreen.width - right
  const layoutHeight = layout.height || 0
  const layoutWidth = layout.width || 0
  const windowHeight = layoutHeight || screenHeight
  try {
    safeArea = {
      left,
      right: screenWidth - right,
      top,
      bottom: screenHeight - bottom,
      height: screenHeight - top - bottom,
      width: screenWidth - left - right
    }
  } catch (error) {
  }
  const result = {
    pixelRatio: PixelRatio.get(),
    windowWidth: hasCustomDimensions ? dimensions.window.width : layoutWidth || screenWidth,
    windowHeight: hasCustomDimensions ? dimensions.window.height : windowHeight, // 取不到layout的时候有个兜底
    screenWidth: hasCustomDimensions ? dimensions.screen.width : screenWidth,
    screenHeight: hasCustomDimensions ? dimensions.screen.height : screenHeight,
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
