import { bridgeFunction, webviewApiList } from './common'

const { navigateTo, navigateBack, switchTab, reLaunch, redirectTo, getEnv, postMessage, getLoadError } = webviewApiList
const { getAdvancedApi } = bridgeFunction

// 此处导出的对象包含所有的api
export default bridgeFunction

export {
  // 此处导出的为3个平台均可使用的小程序api
  navigateTo, navigateBack, switchTab, reLaunch, redirectTo, getEnv, postMessage, getLoadError,
  // 使用native的能力，微信需要配置一个config，其他平台不需要
  getAdvancedApi
}
