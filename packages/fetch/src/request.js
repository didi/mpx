/* eslint-disable no-undef */
import { buildUrl, getEnvObj, serialize, transformRes, isPromise } from './util'

export default function request (config, mpx) {
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
    let requestTask
    let cancelMsg
    const cancelToken = config.cancelToken
    if (cancelToken && isPromise(cancelToken)) {
      cancelToken.then((msg) => {
        cancelMsg = msg
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
      const err = cancelMsg !== undefined ? cancelMsg : res
      typeof rawFail === 'function' && rawFail.call(this, err)
      reject(err)
    }
    const envObj = getEnvObj()

    if (envObj && typeof envObj.request === 'function') {
      requestTask = envObj.request(config)
      return
    }

    if (__mpx_mode__ === 'ali' && typeof envObj.httpRequest === 'function') {
      requestTask = envObj.httpRequest(config)
      return
    }

    mpx = mpx || global.__mpx
    if (typeof mpx !== 'undefined' && typeof mpx.request === 'function') {
      // mpx
      const res = mpx.request(config)
      requestTask = res.__returned || res
      return
    }
    console.error('no available request adapter for current platform')
  })
}
