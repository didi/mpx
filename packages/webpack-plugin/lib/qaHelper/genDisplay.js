/*
*** 生成manifest文件display部分，https://doc.quickapp.cn/framework/manifest.html
 */
const util = require('./util')

module.exports = function genDisplay (displayInfo, appJsonRules) {
  const appJsonWinRules = appJsonRules && appJsonRules.window

  let display = `{`

  const winBgColor = (appJsonWinRules && appJsonWinRules.backgroundColor) || (displayInfo && displayInfo.backgroundColor)
  if (winBgColor) {
    display += `
        "backgroundColor": "${winBgColor}"`
  }

  if (displayInfo && displayInfo.fullScreen) {
    display += `,
        "fullScreen": ${displayInfo.fullScreen}`
  }

  let hasTitleBar
  if (appJsonWinRules && appJsonWinRules.navigationBarTitleText) {
    hasTitleBar = !!(appJsonWinRules && appJsonWinRules.navigationBarTitleText)
  } else {
    hasTitleBar = displayInfo && displayInfo.titleBar
  }
  if (hasTitleBar) {
    display += `,
        "titleBar": ${hasTitleBar}`
  }

  const titleBarBgColor = (appJsonWinRules && appJsonWinRules.navigationBarBackgroundColor) || (displayInfo && displayInfo.titleBarBackgroundColor)
  if (titleBarBgColor) {
    display += `,
        "titleBarBackgroundColor": "${titleBarBgColor}"`
  }

  const titleBarTextColor = (appJsonWinRules && appJsonWinRules.navigationBarTextStyle) || (displayInfo && displayInfo.titleBarTextColor)
  if (titleBarTextColor) {
    display += `,
        "titleBarTextColor": "${titleBarTextColor}"`
  }

  const titleBarText = (appJsonWinRules && appJsonWinRules.navigationBarTitleText) || (displayInfo && displayInfo.titleBarText)
  if (titleBarText) {
    display += `,
        "titleBarText": "${titleBarText}"`
  }

  if (displayInfo && displayInfo.menu) {
    display += `,
        "menu": ${displayInfo && displayInfo.menu}`
  }

  if (displayInfo && displayInfo.windowSoftInputMode) {
    display += `,
        "windowSoftInputMode": "${displayInfo.windowSoftInputMode}"`
  }

  const orientation = (appJsonWinRules && appJsonWinRules.pageOrientation) || (displayInfo && displayInfo.orientation)
  if (orientation) {
    display += `,
        "orientation": "${orientation}"`
  }

  if (displayInfo && displayInfo.statusBarImmersive) {
    display += `,
        "statusBarImmersive": ${displayInfo.statusBarImmersive}`
  }

  if (displayInfo && displayInfo.statusBarTextStyle) {
    display += `,
        "statusBarTextStyle": "${displayInfo.statusBarTextStyle}"`
  }

  const topWinBgColor = displayInfo && displayInfo.statusBarBackgroundColor
  if (topWinBgColor) {
    display += `,
        "statusBarBackgroundColor": "${topWinBgColor}"`
  }

  if (displayInfo && displayInfo.statusBarBackgroundOpacity) {
    display += `,
        "statusBarBackgroundOpacity": ${displayInfo.statusBarBackgroundOpacity}`
  }

  if (displayInfo && displayInfo.fitCutout) {
    display += `,
        "fitCutout": ${displayInfo.fitCutout}`
  }

  if (displayInfo && displayInfo.themeMode) {
    display += `,
        "themeMode": ${displayInfo.themeMode}`
  }

  if (displayInfo && displayInfo.forceDark) {
    display += `,
        "forceDark": ${displayInfo.forceDark}`
  }

  if (displayInfo && displayInfo.pageCache) {
    display += `,
        "pageCache": ${displayInfo.pageCache}`
  }

  if (displayInfo && displayInfo.cacheDuration) {
    display += `,
        "cacheDuration": ${displayInfo.cacheDuration}`
  }

  if (displayInfo && !util.isObjectEmpty(displayInfo.pages)) {
    display += `,\n
        "pages": ${util.obj2json(displayInfo.pages)}
    `
  }

  const menuBarData = (displayInfo && displayInfo.menuBarData) ? util.json2Obj(displayInfo.menuBarData) : {}
  const hasMenuData = !!(((appJsonWinRules && appJsonWinRules.navigationBarTitleText)))
  // app json rules
  if (hasMenuData) {
    display += `,\n
      "menuBarData: {"
        "menuBar": ${hasMenuData},
        "menuBarStyle": ${(appJsonWinRules && appJsonWinRules.backgroundColorTop) || 'dark'}
    }`
  } else if (menuBarData.menuBar) {
    display += `,\n
        "menuBarData": "${util.obj2json(displayInfo.menuBarData)}"
    `
  }

  if (display === '{') return ''
  display += `
      }`
  return display
}
