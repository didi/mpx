import { BEFORECREATE, CREATED, DESTROYED, MOUNTED, UPDATED, BEFOREMOUNT } from '../../../core/innerLifecycle'

const APP_HOOKS = [
  'onLaunch',
  'onShow',
  'onHide',
  'onError',
  'onPageNotFound',
  'onUnhandledRejection',
  'onThemeChange'
]

const PAGE_HOOKS = [
  'onLoad',
  'onReady',
  'onShow',
  'onHide',
  'onUnload',
  'onPullDownRefresh',
  'onReachBottom',
  'onShareAppMessage',
  'onPageScroll',
  'onTabItemTap',
  'onResize'
]

const COMPONENT_HOOKS = [
  'beforeCreate',
  'created',
  'attached',
  'ready',
  'moved',
  'detached',
  'updated',
  'pageShow',
  'pageHide',
  'definitionFilter'
]

export const lifecycleProxyMap = {
  [BEFORECREATE]: ['beforeCreate'],
  // onLoad需要获取页面query参数，不做代理，所有平台都与此保持一致。
  [CREATED]: ['created', 'attached'],
  [UPDATED]: ['updated'],
  [BEFOREMOUNT]: ['beforeMount'],
  [MOUNTED]: ['ready', 'onReady'],
  [DESTROYED]: ['detached', 'onUnload']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
