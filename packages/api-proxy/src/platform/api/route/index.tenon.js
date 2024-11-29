import { successHandle } from '../../../common/js'
import { EventChannel } from '../event-channel'
const { Navigator } = __GLOBAL__

function handleUrl (url) {
  const [urlString, queryString] = url.split('?')
  const queryObj = {}

  if (!queryString) {
    return {
      query: queryObj,
      url: urlString
    }
  }

  const paramsArray = queryString.split('&')
  for (const pair of paramsArray) {
    const [key, value] = pair.split('=')
    queryObj[key] = decodeURIComponent(value)
  }

  return {
    query: queryObj,
    url: urlString
  }
}

function redirectTo (options = {}) {
  const { url, query } = handleUrl(options.url || '')
  if (Navigator) {
    return new Promise((resolve, reject) => {
      // 关闭本页面的跳转
      Navigator.openPage(
        {
          url,
          animated: false,
          params: Object.assign({}, query, options.query || {}),
          closeSelf: true
        },
        // 执行环境变了 得不到执行的机会 故回调无效
        () => {}
      )
      const res = { errMsg: 'redirectTo:ok' }
      successHandle(res, options.success, options.complete)
      resolve(res)
    })
  }
}

function navigateTo (options = {}) {
  const { url, query } = handleUrl(options.url || '')
  const events = options.events

  if (Navigator) {
    const eventChannel = new EventChannel()
    if (events) {
      eventChannel._addListeners(events)
    }
    return new Promise((resolve, reject) => {
      // 不关闭本页面的跳转
      Navigator.openPage({
        url,
        animated: true,
        params: Object.assign({}, query, options.query || {})
      })
      const res = { errMsg: 'redirectTo:ok', eventChannel }
      successHandle(res, options.success, options.complete)
      resolve(res)
    })
  }
}

function navigateBack (options = {}) {
  if (Navigator) {
    const delta = options.delta || 1
    Navigator.popBack(delta, {
      animated: true
    })
    const res = { errMsg: 'navigateBack:ok' }
    successHandle(res, options.success, options.complete)
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
    successHandle(res, options.success, options.complete)
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
      successHandle(res, options.success, options.complete)
      resolve(res)
    })
  }
}

export { redirectTo, navigateTo, navigateBack, reLaunch, switchTab }
