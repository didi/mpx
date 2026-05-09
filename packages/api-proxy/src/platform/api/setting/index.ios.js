import { getWindowInfo } from '../system/rnSystem'

/**
 * RN 平台模拟胶囊按钮的布局位置
 * 由于 RN 应用没有微信的右上角胶囊按钮,这里返回一个基于屏幕尺寸和安全区计算的模拟值
 * 主要用于保持代码兼容性,让开发者可以获取顶部导航区域的参考尺寸
 */
const getMenuButtonBoundingClientRect = function () {
  const windowInfo = getWindowInfo()
  const { screenWidth, statusBarHeight } = windowInfo

  // 微信小程序胶囊按钮的典型尺寸
  const CAPSULE_WIDTH = 87 // 胶囊宽度
  const CAPSULE_HEIGHT = 32 // 胶囊高度
  const MARGIN_RIGHT = 7 // 距离右边距离
  const MARGIN_TOP = 4 // 状态栏下方的间距

  // 计算胶囊按钮的位置
  const top = statusBarHeight + MARGIN_TOP
  const right = screenWidth - MARGIN_RIGHT
  const left = right - CAPSULE_WIDTH
  const bottom = top + CAPSULE_HEIGHT

  return {
    width: CAPSULE_WIDTH,
    height: CAPSULE_HEIGHT,
    top,
    right,
    bottom,
    left
  }
}

export {
  getMenuButtonBoundingClientRect
}
