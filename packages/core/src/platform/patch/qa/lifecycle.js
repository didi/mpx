import { BEFORECREATE, CREATED, UPDATED } from '../../../core/innerLifecycle'

const APP_HOOKS = [
  'onCreate',
  'onPageNotFound',
  'onDestroy',
  'onError'
]

const PAGE_HOOKS = [
  'onCreate',
  'onInit',
  'onReady',
  'onShow',
  'onHide',
  'onDestroy',
  'onBackPress',
  'onMenuPress'
]

const COMPONENT_HOOKS = [
  'onCreate',
  'onInit',
  'onReady',
  'onDestroy',
]

export const lifecycleProxyMap = {
  [BEFORECREATE]: ['onCreate'],
  [CREATED]: ['onInit', 'onReady']
}

export const LIFECYCLE = {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
