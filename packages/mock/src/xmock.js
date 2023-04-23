import mock from 'mockjs'

const processType = getProcessType()
let rawRequest = null
let process = null
let request = ''
if (processType === 'wx') {
  rawRequest = wx.request.bind(wx)
  process = wx
  request = 'request'
} else if (processType === 'ali') {
  rawRequest = my.request || my.httpRequest
  process = my
  request = my.request ? 'request' : 'httpRequest'
} else if (processType === 'swan') {
  rawRequest = swan.request.bind(swan)
  process = swan
  request = 'request'
} else {
  console.error('a unknow process')
}

export default function xmock (mockRequstList) {
  if (!mockRequstList || !mockRequstList.length) {
    console.error('please provide a mock mockRequstList')
    return
  }
  Object.defineProperty(process, request, {
    configurable: true,
    enumerable: true,
    get () {
      return (config) => {
        let isMock = false
        let mockItem = null
        mockRequstList.forEach(item => {
          if (!item.url) {
            console.error('please provide a mock url')
            return
          }
          const url = parseUrl(config.url).url
          if (match(url, item.url) && item.rule) {
            isMock = true
            mockItem = item
          }
        })
        if (isMock) {
          const rawSuccess = config.success
          config.success = function (res) {
            res.data = mock.mock(mockItem.rule)
            typeof rawSuccess === 'function' && rawSuccess.call(this, res)
          }
          config.fail = function (res) {
            res.data = mock.mock(mockItem.rule)
            typeof rawSuccess === 'function' && rawSuccess.call(this, res)
          }
        }
        if (processType === 'wx') {
          return rawRequest(config)
        } else if (processType === 'ali') {
          return rawRequest.call(my, config)
        } else if (processType === 'swan') {
          return rawRequest(config)
        }
      }
    }
  })
}

function match (expected, actual) {
  if (type(actual) === 'string') {
    return expected === actual
  }
  if (type(actual) === 'regexp') {
    return actual.test(expected)
  }
}

function type (obj) {
  return (obj === null || obj === undefined) ? String(obj) : Object.prototype.toString.call(obj).match(/\[object (\w+)\]/)[1].toLowerCase()
}

function getProcessType () {
  if (typeof wx !== 'undefined' && typeof wx.request === 'function') {
    // weixin
    return 'wx'
  }
  if (typeof my !== 'undefined') {
    // alipay
    const request = my.request || my.httpRequest
    if (typeof request === 'function') {
      return 'ali'
    }
  }
  if (typeof swan !== 'undefined' && typeof swan.request === 'function') {
    // baidu
    return 'swan'
  }
}

function parseUrl (url) {
  const query = {}
  const arr = url.match(/[?&][^?&]+=[^?&]+/g) || []
  arr.forEach(function (item) {
    const entry = item.substring(1).split('=')
    const key = decodeURIComponent(entry[0])
    const val = decodeURIComponent(entry[1])
    query[key] = val
  })

  const queryIndex = url.indexOf('?')
  return {
    url: queryIndex === -1 ? url : url.slice(0, queryIndex),
    query
  }
}
