import { successHandle, failHandle } from '../../../common/js'
import { buildQueryStringUrl, parseHeader, tryJsonParse } from './tenonUtil'
const { Request } = __GLOBAL__
const requestFn = new Request()

function request (options = {}) {
  let {
    data = {},
    method = 'GET',
    dataType = 'form',
    responseType = 'json',
    timeout = 60 * 1000,
    header = {},
    success = null,
    fail = null,
    complete = null,
    url = ''
  } = options

  method = method.toUpperCase()

  if (['GET', 'PUT', 'DELETE'].indexOf(method) > -1) {
    url = buildQueryStringUrl(data, url)

    if (method === 'GET') {
      data = {}
    }
  }

  switch (dataType) {
    case 'form':
      header = {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...header
      }
      break

    case 'json':
      header = {
        'Content-Type': 'application/json',
        ...header
      }
      break
  }

  requestFn.url = url
  requestFn.method = method
  requestFn.timeout = timeout
  requestFn.param = data
  requestFn.header = header

  return new Promise((resolve, reject) => {
    requestFn.send((response) => {
      let { status, header: resHeader, data: resData, error } = response
      // 返回的数据处理
      if (status >= 200 && status < 300) {
        if (responseType === 'json' && typeof resData === 'string') {
          try {
            resData = JSON.parse(resData)
          } catch (e) {
            console.log('resDataType默认为"json", 尝试对返回内容进行JSON.parse, 但似乎出了些问题(若不希望对结果进行parse, 可传入resDataType: "text"): ', e)
          }
        }
        const result = {
          errMsg: 'request:ok',
          data: resData,
          statusCode: status,
          header: resHeader
        }
        successHandle(result, success, complete)
        resolve(result)
      } else {
        if (responseType === 'json') {
          resData = tryJsonParse(resData)
        }
        header = parseHeader(header)
        const res = { errMsg: `request:fail ${error.msg}`, data: resData, header }
        failHandle(res, fail, complete)
        reject(res)
      }
    })
  })
}

export { request }
