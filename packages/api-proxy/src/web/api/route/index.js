import { webHandleSuccess, webHandleFail } from '../../../common/js'

const initHistoryLength = window.history.length

function redirectTo (options = {}) {
  const router = window.__mpxRouter
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
  const router = window.__mpxRouter
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
  const router = window.__mpxRouter
  const delta = options.delta || 1
  const res = { errMsg: 'navigateBack:ok' }
  router.go(-delta)
  webHandleSuccess(res, options.success, options.complete)
  return Promise.resolve(res)
}

async function reLaunch (options = {}) {
  const backLength = window.history.length - initHistoryLength
  const res = { errMsg: 'reLaunch:ok' }

  await navigateBack({ delta: backLength })
  await new Promise(resolve => setTimeout(() => resolve(), 100))
  await redirectTo({ url: options.url })

  webHandleSuccess(res, options.success, options.complete)
  return Promise.resolve(res)
}

export {
  redirectTo,
  navigateTo,
  navigateBack,
  reLaunch
}
