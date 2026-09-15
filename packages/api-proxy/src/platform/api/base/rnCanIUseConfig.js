/**
 * React Native 平台支持的 API 和类配置
 *
 * 此文件用于 canIUse 功能，只声明支持的 API，不导入任何实现模块
 * 避免在判断 API 可用性时触发原生模块的加载
 * 对应 platform/index.js 中在 RN 平台具备可用实现且符合 API 核心语义的导出
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
  'onUnhandledRejection',
  'offUnhandledRejection',
  'onLazyLoadError',
  'offLazyLoadError',

  // base
  'base64ToArrayBuffer',
  'arrayBufferToBase64',
  'canIUse',

  // camera
  'createCameraContext',

  // create-intersection-observer
  'createIntersectionObserver',

  // create-selector-query
  'createSelectorQuery',

  // device/network
  'getNetworkType',
  'onNetworkStatusChange',
  'offNetworkStatusChange',

  // image
  'getImageInfo',

  // keyboard
  'onKeyboardHeightChange',
  'offKeyboardHeightChange',
  'hideKeyboard',

  // location
  'getLocation',

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

  // set-navigation-bar
  'setNavigationBarTitle',
  'setNavigationBarColor',

  // socket
  'connectSocket',

  // storage
  'setStorage',
  'getStorage',
  'getStorageInfo',
  'removeStorage',
  'clearStorage',

  // page-scroll-to
  'pageScrollTo',

  // system
  'getSystemInfo',
  'getSystemInfoSync',
  'getDeviceInfo',
  'getWindowInfo',
  'getLaunchOptionsSync',
  'getEnterOptionsSync',

  // setting
  'getMenuButtonBoundingClientRect',

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
  'offWindowResize',

  // bluetooth
  'openBluetoothAdapter',
  'closeBluetoothAdapter',
  'startBluetoothDevicesDiscovery',
  'stopBluetoothDevicesDiscovery',
  'onBluetoothDeviceFound',
  'offBluetoothDeviceFound',
  'getConnectedBluetoothDevices',
  'getBluetoothAdapterState',
  'onBluetoothAdapterStateChange',
  'offBluetoothAdapterStateChange',
  'getBluetoothDevices',
  'writeBLECharacteristicValue',
  'readBLECharacteristicValue',
  'notifyBLECharacteristicValueChange',
  'onBLECharacteristicValueChange',
  'offBLECharacteristicValueChange',
  'setBLEMTU',
  'getBLEDeviceRSSI',
  'getBLEDeviceServices',
  'getBLEDeviceCharacteristics',
  'createBLEConnection',
  'closeBLEConnection',
  'onBLEConnectionStateChange',
  'offBLEConnectionStateChange',

  // wifi
  'startWifi',
  'stopWifi',
  'getWifiList',
  'onGetWifiList',
  'offGetWifiList',
  'getConnectedWifi'
]

/**
 * 支持的类及其方法
 * 对应各个类文件中有实际实现的类和方法
 */
export const SUPPORTED_OBJECTS = {
  // SelectorQuery 相关
  SelectorQuery: [
    'in',
    'select',
    'selectAll',
    'exec'
  ],

  NodesRef: [
    'boundingClientRect',
    'scrollOffset',
    'fields',
    'context',
    'node',
    'ref'
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
    'scale',
    'scaleX',
    'scaleY',
    'translate',
    'translateX',
    'translateY',
    'skew',
    'skewX',
    'skewY',
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
    'abort'
  ],

  // camera
  CameraContext: [
    'setZoom',
    'takePhoto',
    'startRecord',
    'stopRecord'
  ]
}
