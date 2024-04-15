import { webHandleSuccess, webHandleFail } from '../../../common/js'
import { queryParse, parseHeader, tryJsonParse } from './utils'
const { Request } = __GLOBAL__
const requestFn = new Request()

function request (options = { url: '' }) {
  let {
    data = {},
    method = 'GET',
    dataType = 'json',
    responseType = 'text',
    timeout = 60 * 1000,
    header = {},
    success = null,
    fail = null,
    complete = null
  } = options

  method = method.toUpperCase()

  requestFn.url = options.url
  requestFn.method = method
  requestFn.timeout = timeout
  requestFn.header = header
  requestFn.param = data

  if (data) {
    if (dataType === 'form') {
      requestFn.param = queryParse(data)
    } else if (dataType === 'json') {
      try {
        requestFn.param = JSON.parse(data)
      } catch (e) {}
    }
  }

  return new Promise((resolve, reject) => {
    requestFn.send((response) => {
      let { status, header: resHeader, data: resData, error } = response
      // 返回的数据处理
      if (status >= 200 && status < 300) {
        if (responseType === 'json' && typeof resData === 'string') {
          try {
            resData = JSON.parse(resData)
          } catch (e) {
            console.warn('resDataType默认为"json", 尝试对返回内容进行JSON.parse, 但似乎出了些问题(若不希望对结果进行parse, 可传入resDataType: "text"): ', e)
          }
        }
        const result = {
          errMsg: 'request:ok',
          data: resData,
          statusCode: status,
          header: resHeader
        }
        webHandleSuccess(result, success, complete)
        resolve(result)
      } else {
        if (responseType === 'json') {
          resData = tryJsonParse(resData)
        }
        header = parseHeader(header)
        const res = { errMsg: `request:fail ${error.msg}`, data: resData, header }
        webHandleFail(res, fail, complete)
        reject(res)
      }
    })
  })
}

export { request }
