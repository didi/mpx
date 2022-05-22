import {
  BEFORECREATE,
  CREATED,
  DESTROYED,
  MOUNTED,
  UPDATED,
  BEFOREMOUNT,
  ONSHOW,
  ONHIDE,
  ONLOAD
} from '../../../core/innerLifecycle'

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
  [CREATED]: ['onInit', 'created', 'attached'],
  [UPDATED]: ['updated'],
  [BEFOREMOUNT]: ['beforeMount'],
  [MOUNTED]: ['ready', 'onReady'],
  [DESTROYED]: ['detached', 'onUnload'],
  [ONSHOW]: ['pageShow', 'onShow'],
  [ONHIDE]: ['pageHide', 'onHide'],
  [ONLOAD]: ['onLoad']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
