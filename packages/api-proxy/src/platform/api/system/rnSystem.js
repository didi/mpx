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
  const { top = 0, left = 0, bottom = 0, right = 0 } = insets
  const layout = navigation.layout || {}
  const screenHeight = __mpx_mode__ === 'ios' ? dimensionsScreen.height : dimensionsScreen.height - (layout.bottomVirtualHeight || 0) // 解决安卓开启屏幕内导航安卓把安全区计算进去后产生的影响
  const screenWidth = __mpx_mode__ === 'ios' ? dimensionsScreen.width : dimensionsScreen.width - right
  const layoutHeight = layout.height || 0
  const layoutWidth = layout.width || 0
  const windowHeight = layoutHeight || screenHeight
  const localDimensions = {
    screen: {
      width: screenWidth,
      height: screenHeight
    },
    window: {
      width: layoutWidth || screenWidth,
      height: windowHeight
    }
  }
  let customDimensions = localDimensions
  if (typeof mpxGlobal.__mpx?.config?.rnConfig?.customDimensions === 'function') {
    customDimensions = mpxGlobal.__mpx.config.rnConfig.customDimensions(localDimensions) || localDimensions
  }
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
    windowWidth: customDimensions.window.width,
    windowHeight: customDimensions.window.height, // 取不到layout的时候有个兜底
    screenWidth: customDimensions.screen.width,
    screenHeight: customDimensions.screen.height,
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
