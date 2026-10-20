import {
  CREATED,
  UNMOUNTED,
  MOUNTED,
  ONHIDE,
  ONSHOW,
  ONLOAD,
  UPDATED,
  RENDERTRACKED,
  RENDERTRIGGERED
} from '../../../core/innerLifecycle'

const APP_HOOKS = [
  'onLaunch',
  'onShow',
  'onHide',
  'onError',
  'onShareAppMessage',
  'onUnhandledRejection',
  'onPageNotFound'
]

const PAGE_HOOKS = [
  'onLoad',
  'onReady',
  'onShow',
  'onHide',
  'onUnload',
  'onShareAppMessage',
  'onTitleClick',
  'onOptionMenuClick',
  'onPullDownRefresh',
  'onTabItemTap',
  'onPageScroll',
  'onReachBottom',
  'renderTracked',
  'renderTriggered'
]

const COMPONENT_HOOKS = [
  'onInit',
  'deriveDataFromProps',
  'didMount',
  'didUpdate',
  'didUnmount',
  'onError',
  'pageShow',
  'pageHide',
  'renderTracked',
  'renderTriggered'
]

export const lifecycleProxyMap = {
  [CREATED]: ['onInit'],
  [UPDATED]: ['didUpdate'],
  [MOUNTED]: ['didMount', 'onReady'],
  [UNMOUNTED]: ['didUnmount', 'onUnload'],
  [ONSHOW]: ['pageShow', 'onShow'],
  [ONHIDE]: ['pageHide', 'onHide'],
  [ONLOAD]: ['onLoad'],
  [RENDERTRACKED]: ['renderTracked'],
  [RENDERTRIGGERED]: ['renderTriggered']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}

export const pageMode = ''
