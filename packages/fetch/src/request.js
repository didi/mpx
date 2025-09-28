/* eslint-disable no-undef */
import { buildUrl, serialize, transformRes } from './util'
import { request as requestApi } from '@mpxjs/api-proxy/src/platform/api/request'
import JSONBig from 'json-bigint'

const isObject = (thing) => thing !== null && typeof thing === 'object'

export default function request (config) {
  return new Promise((resolve, reject) => {
    const paramsSerializer = config.paramsSerializer || serialize
    const bodySerializer = config.bodySerializer || paramsSerializer
    let useBigInt

    if (config.useBigInt) {
      // 统一在所有平台启用 BigInt 支持：将响应以字符串/文本返回，后续统一用 JSONBig 解析
      useBigInt = true
      if (!config.dataType) {
        // 支付宝小程序需要使用 text，其它平台保持 string
        config.dataType = (__mpx_mode__ === 'ali' ? 'text' : 'string')
      }
      // Web 平台使用 axios：为保证不被 axios/适配层提前 JSON.parse，强制返回纯文本
      if (__mpx_mode__ === 'web') {
        if (!config.responseType || config.responseType === 'json') {
          config.responseType = 'text'
        }
      }
    }
    if (config.useBigInt) {
      delete config.useBigInt
    }
    if (config.params) {
      config.url = buildUrl(config.url, config.params, paramsSerializer)
      // 这个参数保留的话，若其value是响应式数据，在Android支付宝小程序中可能有问题
      delete config.params
    }

    const header = config.header || {}
    const contentType = header['content-type'] || header['Content-Type']
    if (/^POST|PUT$/i.test(config.method) && /application\/x-www-form-urlencoded/i.test(contentType) && typeof config.data === 'object') {
      config.data = bodySerializer(config.data)
    } else if (/^POST|PUT$/i.test(config.method) && isObject(config.data) && (!contentType || contentType.indexOf('application/json') > -1)) {
      config.data = JSONBig.stringify(config.data)
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

      if (useBigInt && typeof res.data === 'string') {
        try {
          // 使用json-bigint库解析包含BigInt的JSON字符串
          res.data = JSONBig.parse(res.data)
        } catch (e) {
          console.error('Error parsing BigInt JSON:', e)
        }
      }

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
