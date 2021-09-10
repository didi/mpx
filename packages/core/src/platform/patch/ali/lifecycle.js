import { BEFORECREATE, BEFOREMOUNT, CREATED, DESTROYED, MOUNTED, UPDATED } from '../../../core/innerLifecycle'

const APP_HOOKS = [
  'onLaunch',
  'onShow',
  'onHide',
  'onError',
  'onShareAppMessage',
  'onUnhandledRejection'
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
  'onTitleClick',
  'onOptionMenuClick',
  'onUpdated',
  'onBeforeCreate'
]

const COMPONENT_HOOKS = [
  'onInit',
  'deriveDataFromProps',
  'didMount',
  'didUpdate',
  'didUnmount',
  'updated',
  'beforeCreate',
  'pageShow',
  'pageHide'
]

export const lifecycleProxyMap = {
  [BEFORECREATE]: ['beforeCreate'],
  [CREATED]: ['onInit', 'onLoad'],
  [UPDATED]: ['didUpdate', 'updated'],
  [BEFOREMOUNT]: ['beforeMount'],
  [MOUNTED]: ['didMount', 'onReady'],
  [DESTROYED]: ['didUnmount', 'onUnload']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
