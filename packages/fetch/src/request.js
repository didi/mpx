/* eslint-disable no-undef */
import { buildUrl, filterUndefined } from './util'
export default function request (config) {
  return new Promise((resolve, reject) => {
    if (!config.url) {
      reject(new Error('no url'))
      return
    }
    if (!config.method) {
      config.method = 'GET'
    } else {
      config.method = config.method.toUpperCase()
    }
    if (config.params) {
      config.url = buildUrl(config.url, filterUndefined(config.params))
    }
    if (config.emulateJSON && /^post|put$/i.test(config.method)) {
      config.header = Object.assign({}, config.header, {
        'content-type': 'application/x-www-form-urlencoded'
      })
    }
    const rawSuccess = config.success
    const rawFail = config.fail
    let requestTask
    let cancelMsg
    const cancelToken = config.cancelToken
    if (cancelToken) {
      cancelToken.then((msg) => {
        cancelMsg = msg
        requestTask && requestTask.abort()
      })
    }
    config.success = function (res) {
      res = Object.assign({ requestConfig: config }, res)
      typeof rawSuccess === 'function' && rawSuccess.call(this, res)
      resolve(res)
    }
    config.fail = function (res) {
      res = Object.assign({ requestConfig: config }, res)
      const err = cancelMsg !== undefined ? cancelMsg : res
      typeof rawFail === 'function' && rawFail.call(this, err)
      reject(err)
    }
    if (typeof wx !== 'undefined' && typeof wx.request === 'function') {
      // weixin
      requestTask = wx.request(config)
      return
    }
    if (typeof my !== 'undefined') {
      // alipay
      const request = my.httpRequest || my.request
      if (typeof request === 'function') {
        requestTask = request.call(my, config)
        return
      }
    }
    if (typeof swan !== 'undefined' && typeof swan.request === 'function') {
      // baidu
      requestTask = swan.request(config)
      return
    }
    console.log('no available request adapter for current platform')
  })
}
