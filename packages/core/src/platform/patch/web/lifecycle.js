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
  'errorCaptured',
  'onPageNotFound'
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
  'onPageScroll'
  // 'onShareAppMessage',
  // 'onTabItemTap',
  // 'onResize'
]

export const LIFECYCLE = {
  APP_HOOKS: COMPONENT_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
