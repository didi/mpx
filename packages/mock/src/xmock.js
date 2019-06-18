import mock from 'mockjs'

const processType = getProcessType()
let rawRequest = null
if (processType === 'wx') {
  rawRequest = wx.request.bind(wx)
} else if (processType === 'ali') {
  rawRequest = my.request || my.httpRequest
} else if (processType === 'swan') {
  rawRequest = swan.request.bind(swan)
} else {
  console.error('a unknow process')
}

export default function xmock (mockRequstList) {
  if (!mockRequstList || !mockRequstList.length) {
    console.error('please provide a mock mockRequstList')
    return
  }
  Object.defineProperty(wx, 'request', {
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
          if (match(url, item.url)) {
            isMock = true
            mockItem = item
          }
        })
        if (isMock) {
          if (!mockItem.rule) {
            console.error('please provide a mock rule')
            return
          }
          const rawSuccess = config.success
          config.success = function (res) {
            res = Object.assign({ requestConfig: config }, transformRes(res))
            res.data = mock.mock(mockItem.rule)
            typeof rawSuccess === 'function' && rawSuccess.call(this, res)
          }
          config.fail = function (res) {
            res = Object.assign({ requestConfig: config }, transformRes(res))
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
  if (type(expected) === 'string') {
    return expected === actual
  }
  if (type(expected) === 'regexp') {
    return expected.test(actual)
  }
}

function type (obj) {
  return (obj === null || obj === undefined) ? String(obj) : Object.prototype.toString.call(obj).match(/\[object (\w+)\]/)[1].toLowerCase()
}

function transformRes (res) {
  // 抹平wx & ali 响应数据
  res.status = res.statusCode = res.status || res.statusCode
  res.header = res.headers = res.header || res.headers
  return res
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
  const arr = url.match(new RegExp('[\?\&][^\?\&]+=[^\?\&]+', 'g')) || [] /* eslint-disable-line no-useless-escape */
  arr.forEach(function (item) {
    let entry = item.substring(1).split('=')
    let key = decodeURIComponent(entry[0])
    let val = decodeURIComponent(entry[1])
    query[key] = val
  })

  const queryIndex = url.indexOf('?')
  return {
    url: queryIndex === -1 ? url : url.slice(0, queryIndex),
    query
  }
}
