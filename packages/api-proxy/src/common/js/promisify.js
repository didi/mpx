import { ENV_OBJ } from './utils'

// 特别指定的不进行Promise封装的方法
const blackList = [
  'clearStorage',
  'hideToast',
  'hideLoading',
  'drawCanvas',
  'canIUse',
  'stopRecord',
  'pauseVoice',
  'stopVoice',
  'pauseBackgroundAudio',
  'stopBackgroundAudio',
  'showNavigationBarLoading',
  'hideNavigationBarLoading',
  'getPerformance',
  'hideKeyboard',
  'stopPullDownRefresh',
  'pageScrollTo',
  'reportAnalytics',
  'getMenuButtonBoundingClientRect',
  'reportMonitor',
  'reportEvent',
  'connectSocket',
  'base64ToArrayBuffer',
  'arrayBufferToBase64',
  'getDeviceInfo',
  'getWindowInfo',
  'getAppBaseInfo',
  'getAppAuthorizeSetting',
  'getApiCategory',
  'postMessageToReferrerPage',
  'postMessageToReferrerMiniProgram',
  'reportPerformance',
  'getPerformance',
  'preDownloadSubpackage',
  'router',
  'nextTick',
  'checkIsPictureInPictureActive',
  'worklet',
  'revokeBufferURL',
  'reportEvent',
  'getExptInfoSync',
  'reserveChannelsLive',
  'getNFCAdapter',
  'isVKSupport'
]

function getMapFromList (list) {
  if (list && list.length) {
    const map = {}
    list.forEach((item) => {
      map[item] = true
    })
    return map
  }
}

function promisify (listObj, whiteList, customBlackList) {
  const result = {}
  const whiteListMap = getMapFromList(whiteList)
  const blackListMap = getMapFromList(blackList.concat(customBlackList))

  function promisifyFilter (key) {
    if (whiteListMap && whiteListMap[key] !== undefined) {
      return !!whiteListMap[key]
    } else {
      return !(blackListMap[key] || // 特别指定的方法
        /^get\w*Manager$/.test(key) || // 获取manager的api
        /^create(?!BLEConnection|BLEPeripheralServer)\w*$/.test(key) || // 创建上下文相关api
        /^(on|off)/.test(key) || // 以 on* 或 off开头的方法
        /\w+Sync$/.test(key) // 以Sync结尾的方法
      )
    }
  }

  Object.keys(listObj).forEach(key => {
    if (typeof listObj[key] !== 'function') {
      return
    }

    result[key] = function (...args) {
      const obj = args[0] || {}
      // 不需要转换 or 用户已定义回调，则不处理
      if (!promisifyFilter(key)) {
        return listObj[key].apply(ENV_OBJ, args)
      } else { // 其他情况进行转换
        if (!args[0]) args.unshift(obj)
        let returned
        const promise = new Promise((resolve, reject) => {
          const originSuccess = obj.success
          const originFail = obj.fail
          obj.success = function (res) {
            originSuccess && originSuccess.call(this, res)
            resolve(res)
          }
          obj.fail = function (e) {
            originFail && originFail.call(this, e)
            reject(e)
          }
          returned = listObj[key].apply(ENV_OBJ, args)
        })
        promise.__returned = returned
        return promise
      }
    }
  })

  return result
}

export default promisify
