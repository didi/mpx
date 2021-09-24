const toString = Object.prototype.toString

// 是否为一个对象
export function isObject (val) {
  return toString.call(val) === '[object Object]'
}

// 是否为一个数组
export function isArray (val) {
  return toString.call(val) === '[object Array]'
}

// 是否为一个字符串
export function isString (val) {
  return toString.call(val) === '[object String]'
}

// 是否为 Date
export function isDate (val) {
  return toString.call(val) === '[object Date]'
}

// 是否为 Function
export function isFunction (val) {
  return toString.call(val) === '[object Function]'
}

export function isThenable (obj) {
  return obj && typeof obj.then === 'function'
}

// 不为空对象
export function isNotEmptyObject (obj) {
  return obj && isObject(obj) && Object.keys(obj).length > 0
}

// 不为空数组
export function isNotEmptyArray (ary) {
  return ary && isArray(ary) && ary.length > 0
}

export function isURLSearchParams (val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams
}

export function encode (val) {
  return encodeURIComponent(val).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%5B/gi, '[').replace(/%5D/gi, ']')
}

export function decode (val) {
  return decodeURIComponent(val)
}

export function forEach (obj, fn) {
  if (obj === null || typeof obj === 'undefined') {
    return
  }

  if (typeof obj !== 'object') {
    obj = [obj]
  }

  if (isArray(obj)) {
    for (let i = 0, l = obj.length; i < l; i++) {
      fn(obj[i], i, obj)
    }
  } else {
    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn(obj[key], key, obj)
      }
    }
  }
}

export function serialize (params) {
  if (isURLSearchParams(params)) {
    return params.toString()
  }
  const parts = []
  forEach(params, (val, key) => {
    if (typeof val === 'undefined' || val === null) {
      return
    }

    if (isArray(val)) {
      key = key + '[]'
    }

    if (!isArray(val)) {
      val = [val]
    }

    forEach(val, function parseValue (v) {
      if (isDate(v)) {
        v = v.toISOString()
      } else if (isObject(v)) {
        v = JSON.stringify(v)
      }
      parts.push(encode(key) + '=' + encode(v))
    })
  })

  return parts.join('&')
}

export function buildUrl (url, params = {}, serializer) {
  if (!serializer) {
    serializer = serialize
  }
  const serializedParams = serializer(params)
  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams
  }

  return url
}

// 解析拆分 url 参数
export function parseUrl (url) {
  const match = /^(.*?)(\?.*?)?(#.*?)?$/.exec(url)
  const [fullUrl, baseUrl = '', search = '', hash = ''] = match
  const protocolReg = /^(\w+:)?\/\//
  const result = protocolReg.exec(baseUrl)
  const protocol = result && result
  const u2 = u1[1] || u1[0] // 可能没有协议
  const host = u2.substring(u2.indexOf('/'), 0) // 分割出主机名和端口号
  const path = u2.substring(u2.indexOf('/')) // 分割出路径
  const hostname = host.split(':')[0]
  const port = host.split(':')[1] || ''

  return { fullUrl, baseUrl, protocol, hostname, port, host, path, search, hash }
}

export function getEnvObj () {
  if (__mpx_mode__ === 'wx') {
    return wx
  } else if (__mpx_mode__ === 'ali') {
    return my
  } else if (__mpx_mode__ === 'swan') {
    return swan
  } else if (__mpx_mode__ === 'qq') {
    return qq
  } else if (__mpx_mode__ === 'tt') {
    return tt
  } else if (__mpx_mode__ === 'dd') {
    return dd
  }
}

export function transformReq (config) {
  // 抹平wx & ali 请求参数
  let header = config.header || config.headers
  const descriptor = {
    get () {
      return header
    },
    set (val) {
      header = val
    },
    enumerable: true,
    configurable: true
  }
  Object.defineProperties(config, {
    header: descriptor,
    headers: descriptor
  })
}

export function transformRes (res) {
  // 抹平wx & ali 响应数据
  if (res.status === undefined) {
    res.status = res.statusCode
  } else {
    res.statusCode = res.status
  }

  if (res.header === undefined) {
    res.header = res.headers
  } else {
    res.headers = res.header
  }
  return res
}

export function deepMerge () {
  const result = {}

  function assignValue (val, key) {
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = deepMerge(result[key], val)
    } else {
      result[key] = val
    }
  }

  for (let i = 0; i < arguments.length; i++) {
    forEach(arguments[i], assignValue)
  }
  return result
}
