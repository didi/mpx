import { MOUNTED } from '../../../core/innerLifecycle'

const APP_HOOKS = [
  'onLaunch',
  'onShow',
  'onHide',
  'onError'
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
  'onOptionMenuClick'
]

const COMPONENT_HOOKS = [
  'didMount',
  'didUpdate',
  'didUnmount',
  'pageShow',
  'pageHide'
]

export const lifecycleProxyMap = {
  [MOUNTED]: ['didMount', 'onReady']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
