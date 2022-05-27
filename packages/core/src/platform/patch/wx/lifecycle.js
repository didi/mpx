import {
  BEFORECREATE,
  CREATED,
  BEFOREUNMOUNT,
  UNMOUNTED,
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
  // 类微信平台中onLoad不能代理到CREATED上，否则Component构造页面时无法获取页面参数
  [CREATED]: ['created', 'attached'],
  [UPDATED]: ['updated'],
  [BEFOREMOUNT]: ['beforeMount'],
  [MOUNTED]: ['ready', 'onReady'],
  [BEFOREUNMOUNT]: ['beforeUnmount'],
  [UNMOUNTED]: ['detached', 'onUnload'],
  [ONSHOW]: ['pageShow', 'onShow'],
  [ONHIDE]: ['pageHide', 'onHide'],
  [ONLOAD]: ['onLoad']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
