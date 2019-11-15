import { handleSuccess, handleFail } from '../../common/ts/utils'

function redirectTo (options: WechatMiniprogram.RedirectToOption) {
  const router = this.$router
  if (router) {
    return new Promise((resolve, reject) => {
      router.replace({
        path: options.url,
        onComplete: () => {
          const res = { errMsg: 'redirectTo:ok' }
          handleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        onAbort: err => {
          const res = { errMsg: `redirectTo:fail ${err}` }
          handleFail(res, options.fail, options.complete)
          !options.fail && reject(res)
        }
      })
    })
  }
}

function navigateTo (options: WechatMiniprogram.NavigateToOption) {
  const router = this.$router
  if (router) {
    return new Promise((resolve, reject) => {
      router.push({
        path: options.url,
        onComplete: () => {
          const res = { errMsg: 'navigateTo:ok', eventChannel: null }
          handleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        onAbort: err => {
          const res = { errMsg: err }
          handleFail(res, options.fail, options.complete)
          !options.fail && reject(res)
        }
      })
    })
  }
}

function navigateBack (options: WechatMiniprogram.NavigateBackOption) {
  const router = this.$router
  const delta = options.delta || 1
  const res = { errMsg: 'navigateBack:ok' }
  router.go(-delta)
  handleSuccess(res, options.success, options.complete)
  return Promise.resolve(res)
}

function reLaunch (options: WechatMiniprogram.ReLaunchOption) {
  const router = this.$router
  if (router) {
    return new Promise((resolve, reject) => {
      router.replace({
        path: options.url,
        onComplete: () => {
          const res = { errMsg: 'reLaunch:ok' }
          handleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        onAbort: err => {
          const res = { errMsg: err }
          handleFail(res, options.fail, options.complete)
          !options.fail && reject(res)
        }
      })
    })
  }
}

function switchTab (options: WechatMiniprogram.SwitchTabOption) {
  const router = this.$router
  if (router) {
    return new Promise((resolve, reject) => {
      router.replace({
        path: options.url,
        onComplete: () => {
          const res = { errMsg: 'switchTab:ok' }
          handleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        onAbort: err => {
          const res = { errMsg: err }
          handleFail(res, options.fail, options.complete)
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
