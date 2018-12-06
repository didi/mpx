// 特别指定的wx对象中不进行Promise封装的方法
const noPromiseMethods = {
  clearStorage: 1,
  hideToast: 1,
  hideLoading: 1,
  drawCanvas: 1,
  canIUse: 1,
  stopRecord: 1,
  pauseVoice: 1,
  stopVoice: 1,
  pauseBackgroundAudio: 1,
  stopBackgroundAudio: 1,
  showNavigationBarLoading: 1,
  hideNavigationBarLoading: 1,
  createAnimation: 1,
  createSelectorQuery: 1,
  hideKeyboard: 1,
  stopPullDownRefresh: 1,
  createWorker: 1,
  pageScrollTo: 1,
  reportAnalytics: 1
}

const promisifyList = {}

Object.keys(wx).forEach((key) => {
  if (
    noPromiseMethods[key] || // 特别指定的方法
    /^get\w*Manager$/.test(key) || // 获取manager的api
    /^create\w*Context$/.test(key) || // 创建上下文相关api
    /^(on|off)/.test(key) || // 以 on* 或 off开头的方法
    /\w+Sync$/.test(key) // 以 Sync 结尾的方法
  ) {
    // 不进行Promise封装
    promisifyList[key] = function () {
      const res = wx[key].apply(wx, arguments)
      return res
    }
    return
  }

  // 其余方法自动Promise化
  promisifyList[key] = function (obj = {}) {
    if (key === 'showModal') {
      // 按钮统一色调
      obj = Object.assign({ confirmColor: '#FC9153' }, obj)
    }
    return new Promise((resolve, reject) => {
      const originSuccess = obj.success
      const originFail = obj.fail
      obj.success = function (res) {
        originSuccess && originSuccess.apply(this, arguments)
        resolve(res)
      }
      obj.fail = function (res) {
        originFail && originFail.apply(this, arguments)
        reject(res)
      }
      wx[key](obj)
    })
  }
})

export default promisifyList
