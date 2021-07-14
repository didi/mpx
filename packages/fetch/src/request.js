/* eslint-disable no-undef */
import { buildUrl, filterUndefined, getEnvObj } from './util'

function transformReq (config) {
  // 抹平wx & ali 请求参数
  let header = config.header || config.headers
  const descriptor = {
    get () {
      return header
    },
    set (val) {
      header = val
    },
    enumerable: true,
    configurable: true
  }
  Object.defineProperties(config, {
    header: descriptor,
    headers: descriptor
  })
}

function transformRes (res) {
  // 抹平wx & ali 响应数据
  if (res.status === undefined) {
    res.status = res.statusCode
  } else {
    res.statusCode = res.status
  }

  if (res.header === undefined) {
    res.header = res.headers
  } else {
    res.headers = res.header
  }
  return res
}

export default function request (config, mpx) {
  return new Promise((resolve, reject) => {
    if (!config.url) {
      reject(new Error('no url'))
      return
    }
    transformReq(config)
    if (!config.method) {
      config.method = 'GET'
    } else {
      config.method = config.method.toUpperCase()
    }
    if (config.params) {
      config.url = buildUrl(config.url, filterUndefined(config.params))
      // 这个参数保留的话，若其value是响应式数据，在Android支付宝小程序中可能有问题
      delete config.params
    }
    if (config.data) {
      config.data = filterUndefined(config.data)
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
