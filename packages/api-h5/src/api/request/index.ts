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
  const header = Object.assign({
    'content-type': 'application/json'
  }, options.header)
  const method = options.method || 'GET'
  const data = options.data
  const dataType = options.dataType || 'json'
  const responseType = options.responseType || 'text'
  const success = options.success || (() => {})
  const fail = options.fail || (() => {})
  const complete = options.complete || (() => {})

  let body = null
  if (method !== 'GET') {
    if (typeof data === 'string' || data instanceof ArrayBuffer) {
      body = data
    } else if (header['content-type'].indexOf('application/json') > -1) {
      try {
        body = JSON.stringify(data)
      } catch (e) {
        body = data.toString()
      }
    } else if (header['content-type'].indexOf('application/x-www-form-urlencoded') > -1) {
      const body = Object.keys(data).reduce((pre, curKey) => {
        return `${pre}&${encodeURIComponent(curKey)}=${encodeURIComponent(data[curKey])}`
      }).slice(1)
    } else {
      body = data.toString()
    }
  }

  const xhr = new XMLHttpRequest()
  const requestTask = new RequestTask(xhr)
  
  xhr.open(method, options.url)
  Object.keys(header).forEach(key => xhr.setRequestHeader(key, header[key]))

  const timer = setTimeout(() => {
    xhr.onload = xhr.onabort = xhr.onerror = null
    requestTask.abort()
    fail({ errMsg: 'request:fail timeout' })
    complete({ errMsg: 'request:fail timeout' })
  }, timeout)

  xhr.responseType = responseType

  xhr.onload = () => {
    clearTimeout(timer)
    const statusCode = xhr.status
    let res = responseType === 'text' ? xhr.responseText : xhr.response
    if (responseType === 'text' && dataType === 'json') {
      try { res = JSON.parse(res) } catch (e) {}
    }
    const headers = xhr.getAllResponseHeaders()
    const headerArr = headers.trim().split(/[\r\n]+/);
    const headerMap = {}
    headerArr.forEach(line => {
      var parts = line.split(': ')
      var header = parts.shift()
      var value = parts.join(': ')
      headerMap[header] = value
    })
    success({
      errMsg: 'request:ok',
      data: res,
      statusCode,
      header: headerArr
    })
    complete({ errMsg: 'request:ok' })
  }

  xhr.onabort = () => {
    clearTimeout(timer)
    fail({ errMsg: 'request:fail abort' })
    complete({ errMsg: 'request:fail abort' })
  }

  xhr.onerror = () => {
    clearTimeout(timer)
    fail({ errMsg: 'request:fail' })
    complete({ errMsg: 'request:fail' })
  }

  xhr.send(body)
  return requestTask
}

export {
  request
}