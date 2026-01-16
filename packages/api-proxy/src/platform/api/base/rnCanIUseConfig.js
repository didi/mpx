/**
 * React Native 平台支持的 API 和类配置
 *
 * 此文件用于 canIUse 功能，只声明支持的 API，不导入任何实现模块
 * 避免在判断 API 可用性时触发原生模块的加载
 * 对应 platform/index.js 中的所有导出，且在 RN 平台有实际实现
 */
export const SUPPORTED_APIS = [
  // action-sheet
  'showActionSheet',

  // animation
  'createAnimation',

  // app
  'onAppShow',
  'onAppHide',
  'offAppShow',
  'offAppHide',
  'onError',
  'offError',

  // base
  'base64ToArrayBuffer',
  'arrayBufferToBase64',

  // create-intersection-observer
  'createIntersectionObserver',

  // create-selector-query
  'createSelectorQuery',

  // device/network
  'getNetworkType',
  'onNetworkStatusChange',
  'offNetworkStatusChange',

  // image
  'previewImage',
  'compressImage',
  'getImageInfo',
  'chooseMedia',

  // keyboard
  'onKeyboardHeightChange',
  'offKeyboardHeightChange',
  'hideKeyboard',

  // location
  'getLocation',
  'openLocation',
  'chooseLocation',
  'onLocationChange',
  'offLocationChange',
  'startLocationUpdate',
  'stopLocationUpdate',

  // make-phone-call
  'makePhoneCall',

  // modal
  'showModal',

  // next-tick
  'nextTick',

  // request
  'request',

  // route
  'redirectTo',
  'navigateTo',
  'navigateBack',
  'reLaunch',
  'switchTab',

  // set-navigation-bar
  'setNavigationBarTitle',
  'setNavigationBarColor',

  // socket
  'connectSocket',

  // storage
  'setStorage',
  'setStorageSync',
  'getStorage',
  'getStorageSync',
  'getStorageInfo',
  'getStorageInfoSync',
  'removeStorage',
  'removeStorageSync',
  'clearStorage',
  'clearStorageSync',

  // system
  'getSystemInfo',
  'getSystemInfoSync',

  // toast
  'showToast',
  'hideToast',
  'showLoading',
  'hideLoading',

  // vibrate
  'vibrateShort',
  'vibrateLong',

  // window
  'onWindowResize',
  'offWindowResize'
]

/**
 * 支持的类及其方法
 * 对应各个类文件中定义的类和方法
 */
export const SUPPORTED_OBJECTS = {
  // SelectorQuery 相关
  SelectorQuery: [
    'in',
    'select',
    'selectAll',
    'selectViewport',
    'exec'
  ],

  NodesRef: [
    'boundingClientRect',
    'scrollOffset',
    'fields',
    'context',
    'node'
  ],

  // IntersectionObserver
  IntersectionObserver: [
    'relativeTo',
    'relativeToViewport',
    'observe',
    'disconnect'
  ],

  // Animation
  Animation: [
    'opacity',
    'backgroundColor',
    'width',
    'height',
    'top',
    'left',
    'bottom',
    'right',
    'rotate',
    'rotateX',
    'rotateY',
    'rotateZ',
    'rotate3d',
    'scale',
    'scaleX',
    'scaleY',
    'scaleZ',
    'scale3d',
    'translate',
    'translateX',
    'translateY',
    'translateZ',
    'translate3d',
    'skew',
    'skewX',
    'skewY',
    'matrix',
    'matrix3d',
    'step',
    'export'
  ],

  // Task 相关
  SocketTask: [
    'send',
    'close',
    'onOpen',
    'onClose',
    'onError',
    'onMessage'
  ],

  RequestTask: [
    'abort',
    'onHeadersReceived',
    'offHeadersReceived'
  ]
}
