import { webHandleSuccess, webHandleFail } from '../../../common/js'

const initHistoryLength = window.history.length

// 用于 navigator 组件
if (window.__mpxRouter) {
  Object.defineProperty(window.__mpxRouter, 'reLaunch', {
    get () {
      return reLaunch
    }
  })
}

function redirectTo (options = {}) {
  const router = window.__mpxRouter
  if (router) {
    router.__mpxAction = { type: 'redirect' }
    return new Promise((resolve, reject) => {
      router.replace(
        {
          path: options.url
        },
        () => {
          const res = { errMsg: 'redirectTo:ok' }
          webHandleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        err => {
          const res = { errMsg: `redirectTo:fail ${err}` }
          webHandleFail(res, options.fail, options.complete)
          !options.fail && reject(res)
        }
      )
    })
  }
}

function navigateTo (options = {}) {
  const router = window.__mpxRouter
  if (router) {
    router.__mpxAction = { type: 'to' }
    return new Promise((resolve, reject) => {
      router.push(
        {
          path: options.url
        },
        () => {
          const res = { errMsg: 'navigateTo:ok', eventChannel: null }
          webHandleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        err => {
          const res = { errMsg: err }
          webHandleFail(res, options.fail, options.complete)
          !options.fail && reject(res)
        }
      )
    })
  }
}

function navigateBack (options = {}) {
  const router = window.__mpxRouter
  if (router) {
    const delta = options.delta || 1
    if (!options.reLaunch) {
      router.__mpxAction = {
        type: 'back',
        delta
      }
    }
    router.go(-delta)
    const res = { errMsg: 'navigateBack:ok' }
    webHandleSuccess(res, options.success, options.complete)
    return Promise.resolve(res)
  }
}

async function reLaunch (options = {}) {
  const router = window.__mpxRouter
  if (router) {
    const backLength = window.history.length - initHistoryLength
    // 通过__mpxAction标识当前是个reLaunch操作，在全局的beforeEnter钩子中决定back之后是否需要进行replace操作
    router.__mpxAction = { type: 'reLaunch', path: options.url }
    await navigateBack({ delta: backLength, reLaunch: true })
    await new Promise(resolve => setTimeout(() => resolve(), 100))
    const res = { errMsg: 'reLaunch:ok' }
    webHandleSuccess(res, options.success, options.complete)
    return Promise.resolve(res)
  }
}

export {
  redirectTo,
  navigateTo,
  navigateBack,
  reLaunch
}
