function typeEqual (obj, type) {
  return Object.prototype.toString.call(obj) === '[object ' + type + ']'
}

function isStr (obj) {
  return typeEqual(obj, 'String')
}

export function queryParse (search = '') {
  const arr = search.split(/(\?|&)/)
  const parmsObj = {}

  for (let i = 0; i < arr.length; i++) {
    if (arr[i].indexOf('=') !== -1) {
      const keyValue = arr[i].match(/([^=]*)=(.*)/)
      parmsObj[keyValue[1]] = decodeURIComponent(keyValue[2])
    }
  }

  if (JSON.stringify(parmsObj) === '{}') {
    // 如果解析失败，返回原值
    return search
  }

  return parmsObj
}

export function tryJsonParse (some) {
  // 这里eslint提示也先别删除\[\]
  // eslint-disable-next-line no-useless-escape
  if (isStr(some) && /[\{\[].*[\}\]]/.test(some)) {
    try {
      some = JSON.parse(some)
    } catch (err) {}
  }

  return some
}

export function parseHeader (headers) {
  // fetch中的headers value为数组形式,其他端为字符串形式， 统一为字符串
  // header的key值统一为小写
  const result = {}
  Object.keys(headers).forEach(key => {
    let value = headers[key]

    if (value instanceof Array) {
      value = value[0]
    }

    result[key.toLowerCase()] = value
  })
  return JSON.stringify(result)
}

export function queryStringify (obj) {
  const strArr = []
  let keys = null

  if (obj && Object.keys(obj).length > 0) {
    keys = Object.keys(obj)

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      strArr.push(`${key}=${encodeURIComponent(obj[key])}`)
    }
  }

  return strArr.join('&')
}
export function buildQueryStringUrl (params, url = '') {
  if (!url) return queryStringify(params)
  let retUrl = url

  if (queryStringify(params)) {
    retUrl = url.indexOf('?') > -1 ? `${url}&${queryStringify(params)}` : `${url}?${queryStringify(params)}`
  }

  return retUrl
}
