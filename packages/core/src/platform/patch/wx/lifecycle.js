import {
  CREATED,
  UNMOUNTED,
  MOUNTED,
  ONSHOW,
  ONHIDE,
  ONLOAD,
  ONRESIZE,
  SERVERPREFETCH,
  REACTHOOKSEXEC
} from '../../../core/innerLifecycle'

const APP_HOOKS = [
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

const PAGE_HOOKS = [
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

const COMPONENT_HOOKS = [
  'created',
  'attached',
  'ready',
  'moved',
  'detached',
  'pageShow',
  'pageHide',
  'serverPrefetch',
  'reactHooksExec'
]

export const lifecycleProxyMap = {
  // 类微信平台中onLoad不能代理到CREATED上，否则Component构造页面时无法获取页面参数
  [CREATED]: ['created', 'attached'],
  [MOUNTED]: ['ready', 'onReady'],
  [UNMOUNTED]: ['detached', 'onUnload'],
  [ONSHOW]: ['pageShow', 'onShow'],
  [ONHIDE]: ['pageHide', 'onHide'],
  [ONLOAD]: ['onLoad'],
  [ONRESIZE]: ['onResize'],
  [SERVERPREFETCH]: ['serverPrefetch'],
  [REACTHOOKSEXEC]: ['reactHooksExec']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
