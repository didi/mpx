import { webHandleSuccess, webHandleFail } from '../../../common/js'

function redirectTo (options = {}) {
  const router = this.$router
  if (router) {
    return new Promise((resolve, reject) => {
      router.replace({
        path: options.url,
        onComplete: () => {
          const res = { errMsg: 'redirectTo:ok' }
          webHandleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        onAbort: err => {
          const res = { errMsg: `redirectTo:fail ${err}` }
          webHandleFail(res, options.fail, options.complete)
          !options.fail && reject(res)
        }
      })
    })
  }
}

function navigateTo (options = {}) {
  const router = this.$router
  if (router) {
    return new Promise((resolve, reject) => {
      router.push({
        path: options.url,
        onComplete: () => {
          const res = { errMsg: 'navigateTo:ok', eventChannel: null }
          webHandleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        onAbort: err => {
          const res = { errMsg: err }
          webHandleFail(res, options.fail, options.complete)
          !options.fail && reject(res)
        }
      })
    })
  }
}

function navigateBack (options = {}) {
  const router = this.$router
  const delta = options.delta || 1
  const res = { errMsg: 'navigateBack:ok' }
  router.go(-delta)
  webHandleSuccess(res, options.success, options.complete)
  return Promise.resolve(res)
}

function reLaunch (options = {}) {
  const router = this.$router
  if (router) {
    return new Promise((resolve, reject) => {
      router.replace({
        path: options.url,
        onComplete: () => {
          const res = { errMsg: 'reLaunch:ok' }
          webHandleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        onAbort: err => {
          const res = { errMsg: err }
          webHandleFail(res, options.fail, options.complete)
          !options.fail && reject(res)
        }
      })
    })
  }
}

function switchTab (options = {}) {
  const router = this.$router
  if (router) {
    return new Promise((resolve, reject) => {
      router.replace({
        path: options.url,
        onComplete: () => {
          const res = { errMsg: 'switchTab:ok' }
          webHandleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        onAbort: err => {
          const res = { errMsg: err }
          webHandleFail(res, options.fail, options.complete)
          !options.fail && reject(res)
        }
      })
    })
  }
}

export {
  redirectTo,
  navigateTo,
  navigateBack,
  reLaunch,
  switchTab
}
