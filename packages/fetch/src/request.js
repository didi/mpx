/* eslint-disable no-undef */
import { buildUrl, serialize, transformRes } from './util'
import { request as requestApi } from '@mpxjs/api-proxy/src/platform/api/request'

export default function request (config) {
  return new Promise((resolve, reject) => {
    const paramsSerializer = config.paramsSerializer || serialize
    const bodySerializer = config.bodySerializer || paramsSerializer

    if (config.params) {
      config.url = buildUrl(config.url, config.params, paramsSerializer)
      // 这个参数保留的话，若其value是响应式数据，在Android支付宝小程序中可能有问题
      delete config.params
    }

    const header = config.header || {}
    const contentType = header['content-type'] || header['Content-Type']
    if (/^POST|PUT$/i.test(config.method) && /application\/x-www-form-urlencoded/i.test(contentType) && typeof config.data === 'object') {
      config.data = bodySerializer(config.data)
    }

    const rawSuccess = config.success
    const rawFail = config.fail
    // eslint-disable-next-line prefer-const
    let requestTask
    let cancelMsg
    let cancelFlag = false
    const cancelToken = config.cancelToken
    if (cancelToken) {
      cancelToken.then((msg) => {
        cancelMsg = msg
        cancelFlag = true
        requestTask && requestTask.abort()
      })
    }
    config.success = function (res) {
      res = Object.assign({ requestConfig: config }, transformRes(res))
      typeof rawSuccess === 'function' && rawSuccess.call(this, res)
      resolve(res)
    }
    config.fail = function (res) {
      res = Object.assign({ requestConfig: config }, transformRes(res))
      if (cancelFlag) {
        res.errMsg = cancelMsg || res.errMsg
        res.__CANCEL__ = true
      }
      typeof rawFail === 'function' && rawFail.call(this, res)
      reject(res)
    }

    requestTask = requestApi(config)
    return requestTask
  })
}
