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
  'serverPrefetch'
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
  'onThemeChange',
  'onSSRAppCreated',
  'onAppInit'
]

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}

export const pageMode = ''

export const lifecycleProxyMap = {}
