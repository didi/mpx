import {
  CREATED,
  UNMOUNTED,
  MOUNTED,
  ONSHOW,
  ONHIDE,
  ONLOAD,
  ONRESIZE
} from '../../../core/innerLifecycle'

const APP_HOOKS = [
  'onLogin',
  'onLaunch',
  'onShow',
  'onHide',
  'onError',
  'onPageNotFound'
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
  'onPageScroll',
  'onShareAppMessage',
  'onTabItemTap',
  'onURLQueryChange',
  'onResize'
]

const COMPONENT_HOOKS = [
  'created',
  'attached',
  'ready',
  'detached',
  'pageShow',
  'pageHide'
]

export const lifecycleProxyMap = {
  [CREATED]: ['onInit', 'created', 'attached'],
  [MOUNTED]: ['ready', 'onReady'],
  [UNMOUNTED]: ['detached', 'onUnload'],
  [ONSHOW]: ['pageShow', 'onShow'],
  [ONHIDE]: ['pageHide', 'onHide'],
  [ONLOAD]: ['onLoad'],
  [ONRESIZE]: ['onResize']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
