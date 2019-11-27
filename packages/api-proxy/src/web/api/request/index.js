import axios from 'axios'
import { webHandleSuccess, webHandleFail } from '../../../common/js'

function request (options = { url: '' }) {
  const timeout = 60 * 1000
  const CancelToken = axios.CancelToken
  const source = CancelToken.source()

  let {
    data = {},
    method = 'GET',
    dataType = 'json',
    responseType = 'text',
    header = {},
    success = null,
    fail = null,
    complete = null
  } = options

  const params = method === 'GET' ? data : {}

  if (
    method === 'POST' &&
    (header['Content-Type'] === 'application/x-www-form-urlencoded' ||
    header['content-type'] === 'application/x-www-form-urlencoded')
  ) {
    data = Object.keys(data).reduce((pre, curKey) => {
      return `${pre}&${encodeURIComponent(curKey)}=${encodeURIComponent(data[curKey])}`
    }, '').slice(1)
  }

  // @ts-ignore
  return axios({
    method,
    url: options.url,
    params,
    data,
    headers: header,
    responseType,
    timeout,
    cancelToken: source.token
  }).then(res => {
    let data = res.data
    if (responseType === 'text' && dataType === 'json') {
      try { data = JSON.parse(data) } catch (e) {}
    }
    const result = {
      errMsg: 'request:ok',
      data,
      statusCode: res.status,
      header: res.headers
    }
    webHandleSuccess(result, success, complete)
    return result
  }).catch(err => {
    const res = { errMsg: `request:fail ${err}` }
    webHandleFail(res, fail, complete)
    if (!fail) {
      return Promise.reject(res)
    }
  })
}

export {
  request
}
