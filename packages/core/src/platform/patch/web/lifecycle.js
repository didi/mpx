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
  'onAddToFavorites',
  'onShareAppMessage',
  'onShareTimeline',
  'onResize',
  'onTabItemTap',
  'onSaveExitState'
]

const APP_HOOKS = [
  ...COMPONENT_HOOKS,
  'onLaunch',
  'onShow',
  'onHide',
  'onError',
  'onPageNotFound',
  'onUnhandledRejection',
  'onThemeChange'
]

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
