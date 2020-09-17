import { BEFORECREATE, CREATED, UPDATED } from '../../../core/innerLifecycle'

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
  [BEFORECREATE]: ['beforeCreate', 'onBeforeCreate'],
  [CREATED]: ['onLoad', 'onInit'],
  [UPDATED]: ['updated', 'onUpdated']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
