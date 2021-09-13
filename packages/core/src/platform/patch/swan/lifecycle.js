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
  'onInit',
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
  // 为提升性能统一把onInit和onLoad都代理到CREATED中，由onInit触发
  [CREATED]: ['onInit', 'created', 'attached', 'onLoad'],
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
