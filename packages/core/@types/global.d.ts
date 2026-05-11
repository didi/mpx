// declaration for mpx mode
declare let __mpx_mode__: 'wx' | 'ali' | 'swan' | 'qq' | 'tt' | 'web' | 'dd' | 'qa' | 'jd' | 'android' | 'ios' | 'harmony' | 'ks'

// declaration for mpx env
declare let __mpx_env__: string

declare const Mixin: WechatMiniprogram.Behavior.Constructor

// Wildcard module declarations for ?resolve case
declare module '*?resolve' {
  const resourcePath: string
  export default resourcePath
}

declare let setAppShow: () => void
declare let setAppHide: () => void

/**
 * 主动通知框架 dimensions 发生变化，触发 rpx、vw、vh、媒体查询、onResize 等的重新计算。
 *
 * 框架默认已监听 `Dimensions.addEventListener('change', ...)` 自动处理，
 * 在某些容器环境下（如折叠屏、分屏）系统事件无法正常触发时，可手动调用此方法驱动更新。
 *
 * 不传参时默认使用当前全局 dimensions。
 *
 * @param dimensions 包含 window 和 screen 的尺寸信息，不传则使用当前全局 dimensions
 */
declare let notifyDimensionsChange: (dimensions?: { window: import('react-native').ScaledSize; screen: import('react-native').ScaledSize }) => void
