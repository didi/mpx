const COMPONENT_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  // 'activated',
  // 'deactivated',
  'beforeDestroy',
  'destroyed',
  'errorCaptured',
  'beforeUnmount',
  'unmounted'
  // 'onPageNotFound'
]

const PAGE_HOOKS = [
  ...COMPONENT_HOOKS,
  'onLoad',
  'onReady',
  'onShow',
  'onHide',
  'onUnload'
  // 'onBack',
  // 'onPullDownRefresh',
  // 'onReachBottom',
  // 'onPageScroll',
  // 'onTabItemTap',
  // 'onResize'
]

const APP_HOOKS = [
  ...COMPONENT_HOOKS,
  'onLaunch',
  'onShow',
  'onHide',
  'onError'
  // 'onPageNotFound',
  // 'onUnhandledRejection',
  // 'onThemeChange'
]

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
