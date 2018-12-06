const APP_HOOKS = [
  'onLaunch',
  'onShow',
  'onHide',
  'onError',
  'onPageNotFound'
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

// 微信小程序可以使用Component创建页面
const COMPONENT_HOOKS = [
  'created',
  'attached',
  'ready',
  'moved',
  'detached',
  'pageShow',
  'pageHide'
].concat(PAGE_HOOKS)

export {
  APP_HOOKS,
  PAGE_HOOKS,
  COMPONENT_HOOKS
}
