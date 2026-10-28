// 本例公共入口契约：逻辑 px；生产工程在此统一能力检测、归一、校验和缓存。
let windowInfo = { windowHeight: 640, screenHeight: 800, statusBarHeight: 24, safeArea: { bottom: 776 } }
export function getWindowInfo () { return windowInfo }
export function setWindowInfo (value) { windowInfo = value }
