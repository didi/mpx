import {
  BEFORECREATE,
  BEFOREMOUNT,
  CREATED,
  UNMOUNTED,
  BEFOREUNMOUNT,
  MOUNTED,
  ONHIDE,
  ONSHOW,
  ONLOAD,
  UPDATED
} from '../../../core/innerLifecycle'

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
  [CREATED]: ['onInit'],
  [UPDATED]: ['didUpdate', 'updated'],
  [BEFOREMOUNT]: ['beforeMount'],
  [MOUNTED]: ['didMount', 'onReady'],
  [BEFOREUNMOUNT]: ['beforeUnmount'],
  [UNMOUNTED]: ['didUnmount', 'onUnload'],
  [ONSHOW]: ['pageShow', 'onShow'],
  [ONHIDE]: ['pageHide', 'onHide'],
  [ONLOAD]: ['onLoad']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
