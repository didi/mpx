import { bridgeFunction, webviewApiList, exportApiList } from './common'

const { navigateTo, navigateBack, switchTab, reLaunch, redirectTo, getEnv, postMessage } = webviewApiList
const { getLocation, chooseImage, openLocation, getNetworkType, previewImage } = exportApiList
const { wxsdkConfig } = bridgeFunction

// 此处导出的对象包含所有的api
export default bridgeFunction

export {
  // 此处导出的为3个平台均可使用的api
  navigateTo, navigateBack, switchTab, reLaunch, redirectTo, getEnv, postMessage,
  getLocation, chooseImage, openLocation, getNetworkType, previewImage,
  // 微信特有的一个配置sdk的方法
  wxsdkConfig
}
