import axios from 'axios'

class RequestTask {
  abortCb: (...args: any[]) => any
  constructor (abortCb) {
    this.abortCb = abortCb
  }
  abort () {
    if (typeof this.abortCb === 'function') {
      this.abortCb()
    }
  }
}

function request (options: WechatMiniprogram.RequestOption) {
  const timeout = 60 * 1000
  const CancelToken = axios.CancelToken
  const source = CancelToken.source()

  let {
    data = {},
    method = 'GET',
    dataType = 'json',
    responseType = 'text',
    header = {},
    success = () => {},
    fail = () => {},
    complete = () => {}
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
  axios({
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
    success({
      errMsg: 'request:ok',
      data,
      statusCode: res.status,
      header: res.headers
    })
    complete({ errMsg: 'request:ok' })
  }).catch(err => {
    fail({ errMsg: 'request:fail' })
    complete({ errMsg: 'request:fail' })
  })

  return new RequestTask(
    () => source.cancel()
  )
}

export {
  request
}
