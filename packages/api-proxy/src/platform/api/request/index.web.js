import axios from 'axios'
import { successHandle, failHandle, defineUnsupportedProps } from '../../../common/js'
import RequestTask from './RequestTask'
import { serialize, buildUrl } from '@mpxjs/utils'

function request (options = { url: '' }) {
  const CancelToken = axios.CancelToken
  const source = CancelToken.source()
  const requestTask = new RequestTask(source.cancel)

  let {
    url,
    data = {},
    method = 'GET',
    dataType = 'json',
    responseType = 'text',
    timeout = global.__networkTimeout || 60 * 1000,
    header = {},
    success = null,
    fail = null,
    complete = null
  } = options
  method = method.toUpperCase()
  if (method === 'GET') {
    url = buildUrl(url, data)
    data = {}
  }

  if (
    method === 'POST' &&
    typeof data !== 'string' && // string 不做处理
    (header['Content-Type'] === 'application/x-www-form-urlencoded' ||
      header['content-type'] === 'application/x-www-form-urlencoded')
  ) {
    data = serialize(data)
  }

  /**
   * axios 的其他参数
   * baseURL
   * transformRequest
   * transformResponse,
   * headers,
   * params,
   * paramsSerializer,
   * withCredentials,
   * adapter,
   * auth,
   * xsrfCookieName,
   * xsrfHeaderName,
   * onUploadProgress,
   * onDownloadProgress,
   * maxContentLength,
   * maxBodyLength,
   * validateStatus,
   * maxRedirects,
   * socketPath,
   * httpAgent,
   * httpsAgent,
   * decompress
   */
  const rOptions = Object.assign(options, {
    method,
    url,
    data,
    headers: header,
    responseType,
    timeout,
    cancelToken: source.token,
    transitional: {
      // silent JSON parsing mode
      // `true`  - ignore JSON parsing errors and set response.data to null if parsing failed (old behaviour)
      // `false` - throw SyntaxError if JSON parsing failed (Note: responseType must be set to 'json')
      silentJSONParsing: true, // default value for the current Axios version
      // try to parse the response string as JSON even if `responseType` is not 'json'
      forcedJSONParsing: false,
      // throw ETIMEDOUT error instead of generic ECONNABORTED on request timeouts
      clarifyTimeoutError: false
    }
  })
  if (method === 'GET') {
    rOptions.params = rOptions.data || {}
    delete rOptions.data
  }
  axios(rOptions).then(res => {
    let data = res.data
    if (dataType === 'json' && typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
      }
    }

    const result = Object.assign({}, res, {
      errMsg: 'request:ok',
      data,
      statusCode: res.status,
      header: res.headers
    })
    defineUnsupportedProps(result, ['cookies', 'profile', 'exception'])
    successHandle(result, success, complete)
    return result
  }).catch(err => {
    const realError = err || {}
    const response = realError.response || {}
    const res = {
      errMsg: `request:fail ${err}`,
      statusCode: response.status,
      header: response.headers,
      data: response.data,
      stack: realError.stack
    }
    Object.assign(res, realError)
    failHandle(res, fail, complete)
  })

  return requestTask
}

export {
  request
}
