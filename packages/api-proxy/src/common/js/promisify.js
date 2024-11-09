import { noop } from '@mpxjs/utils'
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
  'createAnimation',
  'createAnimationVideo',
  'createSelectorQuery',
  'createIntersectionObserver',
  'getPerformance',
  'hideKeyboard',
  'stopPullDownRefresh',
  'createWorker',
  'pageScrollTo',
  'reportAnalytics',
  'getMenuButtonBoundingClientRect',
  'reportMonitor',
  'createOffscreenCanvas',
  'reportEvent',
  'connectSocket',
  'base64ToArrayBuffer',
  'getDeviceInfo',
  'getWindowInfo'
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
        /^create\w*Context$/.test(key) || // 创建上下文相关api
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
      const rawSuccess = obj.success || noop
      const rawFail = obj.fail || noop
      // 不需要转换 or 用户已定义回调，则不处理
      if (!promisifyFilter(key)) {
        return listObj[key].apply(ENV_OBJ, args)
      } else { // 其他情况进行转换
        if (!args[0]) args.unshift(obj)
        let returned
        const promise = new Promise((resolve, reject) => {
          obj.success = (res) => { 
            resolve(res)
            rawSuccess(res)
          }
          obj.fail = (res) => {
            reject(res)
            rawFail(res)
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
