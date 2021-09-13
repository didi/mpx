import { webHandleSuccess } from '../../../common/js'
import { EventChannel } from '../event-channel'
const { Navigator } = __GLOBAL__

function redirectTo (options = {}) {
  if (Navigator) {
    Navigator.__mpxAction = { type: 'redirect' }
    return new Promise((resolve, reject) => {
      // 关闭本页面的跳转
      Navigator.openPage(
        {
          url: options.url,
          closeSelf: true
        },
        // 执行环境变了 得不到执行的机会 故回调无效
        () => {}
      )
      const res = { errMsg: 'redirectTo:ok' }
      webHandleSuccess(res, options.success, options.complete)
      resolve(res)
    })
  }
}

function navigateTo (options = {}) {
  if (Navigator) {
    const eventChannel = new EventChannel()
    Navigator.__mpxAction = {
      type: 'to',
      eventChannel
    }
    if (options.events) {
      eventChannel._addListeners(options.events)
    }
    return new Promise((resolve, reject) => {
      // 不关闭本页面的跳转
      Navigator.openPage(
        {
          url: options.url
        },
        // 执行环境变了 得不到执行的机会 故回调无效
        () => {}
      )
      const res = { errMsg: 'redirectTo:ok' }
      webHandleSuccess(res, options.success, options.complete)
      resolve(res)
    })
  }
}

function navigateBack (options = {}) {
  if (Navigator) {
    const delta = options.delta || 1
    Navigator.__mpxAction = {
      type: 'back',
      delta
    }
    // popBack方法
    Navigator.popBack(delta, { animated: true })
    const res = { errMsg: 'navigateBack:ok' }
    webHandleSuccess(res, options.success, options.complete)
    return Promise.resolve(res)
  }
}

function reLaunch (options = {}) {
  if (Navigator) {
    Navigator.__mpxAction = {
      type: 'reLaunch'
    }
    Navigator.popToRootPage()

    const res = { errMsg: 'reLaunch:ok' }
    webHandleSuccess(res, options.success, options.complete)
    return Promise.resolve(res)
  }
}

function switchTab (options = {}) {
  if (Navigator) {
    Navigator.__mpxAction = {
      type: 'switch',
      path: options.url,
      replaced: true
    }
    return new Promise((resolve, reject) => {
      Navigator.openPage(
        {
          url: options.url,
          closeSelf: true
        },
        // 执行环境变了 得不到执行的机会 故回调无效
        () => {}
      )
      const res = { errMsg: 'redirectTo:ok' }
      webHandleSuccess(res, options.success, options.complete)
      resolve(res)
    })
  }
}

export { redirectTo, navigateTo, navigateBack, reLaunch, switchTab }
