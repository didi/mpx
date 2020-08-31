/*
*** 生成manifest文件display部分，https://doc.quickapp.cn/framework/manifest.html
 */

module.exports = function genDisplay(displayInfo) {
  let display = `{
        "backgroundColor": "${displayInfo && displayInfo.backgroundColor || '#ffffff'}",
        "fullScreen": ${displayInfo && displayInfo.fullScreen || false},
        "titleBar": ${displayInfo && displayInfo.titleBar || true},
        "titleBarBackgroundColor": "${displayInfo && displayInfo.titleBarBackgroundColor || '#000000'}",
        "titleBarTextColor": "${displayInfo && displayInfo.titleBarTextColor || ''}",
        "titleBarText": "${displayInfo && displayInfo.titleBarText || ''}",
        "menu": ${displayInfo && displayInfo.menu || false},
        "windowSoftInputMode": "${displayInfo && displayInfo.windowSoftInputMode || 'adjustPan'}",
        "orientation": "${displayInfo && displayInfo.orientation || 'portrait'}",
        "statusBarImmersive": ${displayInfo && displayInfo.statusBarImmersive || false},
        "statusBarTextStyle": "${displayInfo && displayInfo.statusBarTextStyle || 'auto'}",
        "statusBarBackgroundColor": "${displayInfo && displayInfo.statusBarBackgroundColor || '#000000'}",
        "statusBarBackgroundOpacity": ${displayInfo && displayInfo.statusBarBackgroundOpacity || false},
        "fitCutout": ${displayInfo && displayInfo.fitCutout || false},
        "themeMode": ${displayInfo && displayInfo.themeMode || -1},
        "forceDark": ${displayInfo && displayInfo.forceDark || true},
        "pageCache": ${displayInfo && displayInfo.pageCache || false},
        "cacheDuration": ${displayInfo && displayInfo.cacheDuration || 3600000}`
  if (displayInfo && displayInfo.pages) {
    display += `,\n
        "pages": ${displayInfo.pages}
    `
  }
  if (displayInfo && displayInfo.menuBarData) {
    display += `,\n
        "menuBarData": "${displayInfo.menuBarData}"
    `
  }
  display += `
      }`
  return display
 }