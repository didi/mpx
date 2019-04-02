import { wxToAliApi } from './platform'
import { getEnvObj, noop } from './utils'

const envObj = getEnvObj()

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
  'createSelectorQuery',
  'hideKeyboard',
  'stopPullDownRefresh',
  'createWorker',
  'pageScrollTo',
  'reportAnalytics'
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

function promisifyFilter (key, whiteList) {
  const whiteListMap = getMapFromList(whiteList)
  const blackListMap = getMapFromList(blackList)

  if (whiteListMap) {
    return !!whiteListMap[key]
  } else {
    return !(blackListMap[key] || // 特别指定的方法
      /^get\w*Manager$/.test(key) || // 获取manager的api
      /^create\w*Context$/.test(key) || // 创建上下文相关api
      /^(on|off)/.test(key) || // 以 on* 或 off开头的方法
      /\w+Sync$/.test(key))
  }
}

function promisify (listObj, whiteList) {
  const promisifyList = {}

  Object.keys(listObj).forEach(key => {
    if (typeof listObj[key] !== 'function') return

    promisifyList[key] = function (...args) {
      if (promisifyFilter(key, whiteList)) {
        if (!args[0]) {
          args[0] = { success: noop, fail: noop }
        }
        const obj = args[0]
        return new Promise((resolve, reject) => {
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
          listObj[key].apply(envObj, args)
        })
      } else {
        return listObj[key].apply(envObj, args)
      }
    }
  })

  return promisifyList
}

export default function getPromisifyList (whiteList, from, to) {
  const promisifyObj = promisify(envObj, whiteList)
  let promisifyTrans = {}

  if (from === 'wx' && to === 'ali') {
    promisifyTrans = promisify(wxToAliApi, whiteList)
  }
  return Object.assign({}, promisifyObj, promisifyTrans)
}
