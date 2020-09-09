const COMPONENT_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'activated',
  'deactivated',
  'beforeDestroy',
  'destroyed',
  'errorCaptured'
]

const PAGE_HOOKS = [
  ...COMPONENT_HOOKS,
  'onLoad',
  'onReady',
  'onShow',
  'onHide',
  'onUnload',
  'onPullDownRefresh',
  'onReachBottom',
  'onPageScroll',
  // 'onShareAppMessage',
  // 'onTabItemTap',
  'onResize'
]

const APP_HOOKS = [
  ...COMPONENT_HOOKS,
  'onLaunch',
  'onShow',
  'onHide'
]

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
