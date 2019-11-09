import axios from 'axios'
class RequestTask {
  xhr: XMLHttpRequest
  constructor (xhr) {
    this.xhr = xhr
  }
  abort () {
    if (this.xhr) {
      this.xhr.abort()
      delete this.xhr
    }
  }
}

function request (options: WechatMiniprogram.RequestOption) {
  const timeout = 60 * 1000
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
  if (method === 'POST' && (header['Content-Type'] === 'application/x-www-form-urlencoded' || header['content-type'] === 'application/x-www-form-urlencoded')) {
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
    timeout
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
}

export {
  request
}