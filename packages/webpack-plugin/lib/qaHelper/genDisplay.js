/*
*** 生成manifest文件display部分，https://doc.quickapp.cn/framework/manifest.html
 */

module.exports = function genDisplay (displayInfo) {
  let display = `{`
  if (displayInfo && displayInfo.backgroundColor) {
    display += `
        "backgroundColor": "${displayInfo.backgroundColor}"`
  }
  if (displayInfo && displayInfo.fullScreen) {
    display += `,
        "fullScreen": ${displayInfo.fullScreen}`
  }
  if (displayInfo && displayInfo.titleBar) {
    display += `,
        "titleBar": ${displayInfo.titleBar}`
  }
  if (displayInfo && displayInfo.titleBarBackgroundColor) {
    display += `,
        "titleBarBackgroundColor": "${displayInfo.titleBarBackgroundColor}"`
  }
  if (displayInfo && displayInfo.titleBarTextColor) {
    display += `,
        "titleBarTextColor": "${displayInfo.titleBarTextColor}"`
  }
  if (displayInfo && displayInfo.titleBarText) {
    display += `,
        "titleBarText": "${displayInfo.titleBarText}"`
  }
  if (displayInfo && displayInfo.menu) {
    display += `,
        "menu": ${displayInfo.menu}`
  }
  if (displayInfo && displayInfo.windowSoftInputMode) {
    display += `,
        "windowSoftInputMode": "${displayInfo.windowSoftInputMode}"`
  }
  if (displayInfo && displayInfo.orientation) {
    display += `,
        "orientation": "${displayInfo.orientation}"`
  }
  if (displayInfo && displayInfo.statusBarImmersive) {
    display += `,
        "statusBarImmersive": ${displayInfo.statusBarImmersive}`
  }
  if (displayInfo && displayInfo.statusBarTextStyle) {
    display += `,
        "statusBarTextStyle": "${displayInfo.statusBarTextStyle}"`
  }
  if (displayInfo && displayInfo.statusBarBackgroundColor) {
    display += `,
        "statusBarBackgroundColor": "${displayInfo.statusBarBackgroundColor}"`
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
  if (displayInfo && displayInfo.pages) {
    display += `,\n
        "pages": ${JSON.stringify(displayInfo.pages)}
    `
  }
  if (displayInfo && displayInfo.menuBarData) {
    display += `,\n
        "menuBarData": "${JSON.stringify(displayInfo.menuBarData)}"
    `
  }
  if (display === '{') return ''
  display += `
      }`
  return display
}
