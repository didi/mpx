import { ENV_OBJ, warn } from './utils'

// 特别指定的不进行Promise封装的方法
const blackList = [
  'drawCanvas',
  'canIUse',
  'getPerformance',
  'reportAnalytics',
  'getMenuButtonBoundingClientRect',
  'reportMonitor',
  'reportEvent',
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
  'router',
  'nextTick',
  'checkIsPictureInPictureActive',
  'worklet',
  'revokeBufferURL',
  'getExptInfoSync',
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
    if (!promisifyFilter(key)) {
      result[key] = listObj[key].bind(ENV_OBJ)
    } else {
      result[key] = function (...args) {
        const obj = args[0] || {}
        if (obj.usePromise === false) {
          return listObj[key].apply(ENV_OBJ, args)
        }
        if (!args[0]) args.unshift(obj)
        let returned
        const promise = new Promise((resolve, reject) => {
          const originSuccess = obj.success
          const originFail = obj.fail
          if (originSuccess || originFail) {
            warn(`The [${key}] method has been promisified, please use .then or .catch to handle the result, if you need to handle the result with options.success/fail, please set options.usePromise to false to close the promisify in this call temporarily. `)
          }
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
