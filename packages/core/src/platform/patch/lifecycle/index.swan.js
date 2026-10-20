import {
  CREATED,
  UNMOUNTED,
  MOUNTED,
  ONSHOW,
  ONHIDE,
  ONLOAD,
  ONRESIZE,
  RENDERTRACKED,
  RENDERTRIGGERED
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
  'onResize',
  'renderTracked',
  'renderTriggered'
]

const COMPONENT_HOOKS = [
  'created',
  'attached',
  'ready',
  'detached',
  'pageShow',
  'pageHide',
  'renderTracked',
  'renderTriggered'
]

export const lifecycleProxyMap = {
  [CREATED]: ['onInit', 'created', 'attached'],
  [MOUNTED]: ['ready', 'onReady'],
  [UNMOUNTED]: ['detached', 'onUnload'],
  [ONSHOW]: ['pageShow', 'onShow'],
  [ONHIDE]: ['pageHide', 'onHide'],
  [ONLOAD]: ['onLoad'],
  [ONRESIZE]: ['onResize'],
  [RENDERTRACKED]: ['renderTracked'],
  [RENDERTRIGGERED]: ['renderTriggered']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}

export const pageMode = 'blend'
