type AddPromise<W> = {
  [K in keyof W]: W[K] extends (...args: any) => any
    ? Parameters<W[K]> extends [{ success?: (res: infer R) => any }?, ...any[]]
      ? (...args: Parameters<W[K]>) => ReturnType<W[K]> & Promise<R>
      : W[K]
    : W[K]
}

type AddParam<O, V extends (...args: any) => any> =
  Parameters<V> extends [{ success?: (res: infer R) => any }, ...any[]]
    ? (options: O) => ReturnType<V> & Promise<R>
    : (options: O) => ReturnType<V>
// @ts-ignore
type PickApiValue<T extends keyof WechatMiniprogram.Wx> = Pick<WechatMiniprogram.Wx, T>[T]
// @ts-ignore
interface GetLocationInterface extends WechatMiniprogram.GetLocationOption {
  aliType?: number
}
// @ts-ignore
interface RequestPaymentInterface extends WechatMiniprogram.RequestPaymentOption {
  tradeNO?: string
}

declare module '@mpxjs/core' {
  // @ts-ignore
  interface Mpx extends AddPromise<WechatMiniprogram.Wx> {
    getLocation: AddParam<GetLocationInterface, PickApiValue<'getLocation'>>
    requestPayment: AddParam<RequestPaymentInterface, PickApiValue<'requestPayment'>>
  }
}

declare const install: (...args: any) => any

export default install

declare const getProxy: (...args: any) => any

declare const promisify: (listObj: object, whiteList: string[], customBlackList: string[]) => object

interface showActionSheetParams {
  itemList: string[]
}
declare const showActionSheet: (args: showActionSheetParams) => any

interface addPhoneContactParams {
  firstName: string
}
declare const addPhoneContact: (args: addPhoneContactParams) => any

declare const onAppShow: (callbackfn: (res: object) => any) => any
declare const onAppHide: (callbackfn: (res: object) => any) => any
declare const offAppShow: (callbackfn: (res: object) => any) => any
declare const offAppHide: (callbackfn: (res: object) => any) => any
interface onErrorParams {
  message: string,
  stack: string
}
declare const onError: (callbackfn: (res: onErrorParams) => any) => any
declare const offError: (callbackfn: (res: object) => any) => any
declare const createInnerAudioContext: (args: object) => any
declare const base64ToArrayBuffer: (base64: string) => object
declare const arrayBufferToBase64: (arrayBuffer: string[]) => string
interface BLEConnectionParams {
  deviceId: string
}
interface BLEStateChangeParams {
  deviceId: string,
  connected: boolean
}
declare const closeBLEConnection: (args: BLEConnectionParams) => any
declare const createBLEConnection: (args: BLEConnectionParams) => any
declare const onBLEConnectionStateChange: (callbackfn: (res: BLEStateChangeParams) => any) => any
declare const createCanvasContext: (args: object) => any
declare const canvasToTempFilePath: (args: object) => any
interface canvasGetImageDataParams {
  canvasId: string,
  x: number,
  y: number,
  width: number,
  height: number
}
declare const canvasGetImageData: (args: canvasGetImageDataParams) => any
declare const checkSession: (args: object) => any
interface setClipboardDataParams {
  data: string
}
declare const setClipboardData: (args: setClipboardDataParams) => any
declare const getClipboardData: (args: object) => any
declare const createIntersectionObserver: (args: object) => any
declare const createSelectorQuery: () => object
declare const getNetworkType: (args: object) => any
interface onNetworkStatusChangeParams {
  isConnected: boolean,
  networkType: string
}
declare const onNetworkStatusChange: (callbackfn: (res: onNetworkStatusChangeParams) => any) => any
declare const offNetworkStatusChange: (callbackfn: (res: any) => any) => any
export class EventChannel {
  emit(eventName:string, args: any)
  off(eventName:string, listener: (args: any) => any)
  on(eventName:string, listener: (args: any) => any)
  once(eventName:string, listener: (args: any) => any)
}
interface onlyUrlParams {
  url: string
}
declare const downloadFile: (args: onlyUrlParams) => any
interface uploadFileParams {
  url: string,
  filePath: string,
  name: string
}
declare const uploadFile: (args: uploadFileParams) => any
declare const getUserInfo: (args: object) => any
interface imageParams {
  urls: string[]
}
declare const previewImage: (args: imageParams) => any
declare const compressImage: (args: imageParams) => any
declare const getEnterOptionsSync: () => object
declare const login: (args: object) => any
interface makePhoneCallParams {
  phoneNumber: string
}
declare const makePhoneCall: (args: makePhoneCallParams) => any
declare const showModal: (args: object) => any
declare const nextTick: (callbackfn: () => any) => any
declare const pageScrollTo: (args: object) => any
declare const stopPullDownRefresh: (args: object) => any
declare const startPullDownRefresh: (args: object) => any
declare const request: (args: onlyUrlParams) => any
interface requestPaymentParams {
  timeStamp: string,
  nonceStr: string,
  package: string,
  paySign: string
}
declare const requestPayment: (args: requestPaymentParams) => any
declare const redirectTo: (args: onlyUrlParams) => any
declare const navigateTo: (args: onlyUrlParams) => any
declare const navigateBack: (args: object) => any
declare const reLaunch: (args: onlyUrlParams) => any
declare const switchTab: (args: onlyUrlParams) => any
declare const scanCode: (args: object) => any
interface screenBrightnessParams {
  value: string
}
declare const setScreenBrightness: (args: screenBrightnessParams) => any
declare const getScreenBrightness: (args: object) => any
interface setTitleParams {
  title: string
}
declare const setNavigationBarTitle: (args: setTitleParams) => any
interface setNavigationBarColorParams {
  frontColor: string,
  backgroundColor: string
}
declare const setNavigationBarColor: (args: setNavigationBarColorParams) => any
declare const connectSocket: (args: onlyUrlParams) => any
interface setStorageParams {
  key: string,
  data: any
}
declare const setStorage: (args: setStorageParams) => any
declare const setStorageSync: (key: string, data: any) => any
interface storageParams {
  key: string
}
declare const getStorage: (args: storageParams) => any
declare const removeStorage: (args: storageParams) => any
declare const getStorageSync: (key: string) => any
declare const getStorageInfo: (args: object) => any
declare const getStorageInfoSync: (args: object) => any
declare const removeStorageSync: (key: string) => any
declare const clearStorage: (args: object) => any
declare const clearStorageSync: () => any
declare const getSystemInfo: (args: object) => any
declare const getSystemInfoSync: (args: object) => any
interface setTabBarItemParams {
  index: number
}
declare const setTabBarItem: (args: setTabBarItemParams) => any
declare const setTabBarStyle: (args: object) => any
declare const showTabBar: (args: object) => any
declare const hideTabBar: (args: object) => any
interface showToastParams {
  title: string
}
declare const showToast: (args: showToastParams) => any
declare const showLoading: (args: showToastParams) => any
declare const hideToast: (args: any) => any
declare const hideLoading: (args: any) => any
declare const createVideoContext: (id: string, context: object) => object
interface windowSize {
  windowWidth: number,
  windowHeight: number
}
interface onWindowResizeParams {
  size: windowSize
}
declare const onWindowResize: (callbackfn: (res: onWindowResizeParams) => any) => any
declare const offWindowResize: (callbackfn: (res: object) => any) => any
declare const createAnimation: (args: any) => any
export {
  getProxy,
  showActionSheet,
  addPhoneContact,
  onAppShow,
  onAppHide,
  offAppHide,
  offAppShow,
  onError,
  offError,
  createInnerAudioContext,
  base64ToArrayBuffer,
  arrayBufferToBase64,
  closeBLEConnection,
  createBLEConnection,
  onBLEConnectionStateChange,
  createCanvasContext,
  canvasToTempFilePath,
  canvasGetImageData,
  checkSession,
  setClipboardData,
  getClipboardData,
  createIntersectionObserver,
  createSelectorQuery,
  getNetworkType,
  onNetworkStatusChange,
  offNetworkStatusChange,
  downloadFile,
  uploadFile,
  getUserInfo,
  previewImage,
  compressImage,
  getEnterOptionsSync,
  login,
  makePhoneCall,
  showModal,
  nextTick,
  pageScrollTo,
  stopPullDownRefresh,
  startPullDownRefresh,
  request,
  requestPayment,
  redirectTo,
  navigateTo,
  navigateBack,
  reLaunch,
  switchTab,
  setScreenBrightness,
  getScreenBrightness,
  setNavigationBarTitle,
  setNavigationBarColor,
  connectSocket,
  setStorage,
  setStorageSync,
  getStorage,
  getStorageSync,
  getStorageInfo,
  getStorageInfoSync,
  removeStorage,
  removeStorageSync,
  clearStorage,
  clearStorageSync,
  getSystemInfo,
  getSystemInfoSync,
  setTabBarItem,
  setTabBarStyle,
  showTabBar,
  hideTabBar,
  showToast,
  hideToast,
  showLoading,
  hideLoading,
  createVideoContext,
  onWindowResize,
  offWindowResize,
  scanCode,
  createAnimation,
  promisify
}
