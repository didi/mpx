import { match } from 'path-to-regexp'

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

export function isPlainPromise (val) {
  return toString.call(val) === '[object Promise]'
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
export function isPromise (val) {
  return (isObject(val) || isPlainPromise(val)) && isFunction(val.then) && isFunction(val.catch)
};

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

  const u1 = baseUrl.split('//') // 分割出协议
  const protocolReg = /^\w+:$/
  const protocol = protocolReg.test(u1[0]) ? u1[0] : ''
  const u2 = u1[1] || u1[0] // 可能没有协议
  const i = u2.indexOf('/')
  const host = i > -1 ? u2.substring(0, i) : u2 // 分割出主机名和端口号
  const path = i > -1 ? u2.substring(i) : '' // 分割出路径
  const u3 = host.split(':')
  const hostname = u3[0]
  const port = u3[1] || ''

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

export function type (a) {
  return toString.call(a).slice(8, -1)
}

/**
 * 匹配项所有属性值，在源对象都能找到匹配
 * @param test 匹配项
 * @param input 源对象
 * @returns {boolean}
 */
function attrMatch (test = {}, input = {}) {
  let result = true
  for (const key in test) {
    // value 值为 true 时 key 存在即命中匹配
    if (test.hasOwnProperty(key) && input.hasOwnProperty(key)) {
      if (test[key] === true) continue
      // value 如果不是字符串需要进行序列化之后再匹配
      const testValue = isString(test[key]) ? test[key] : JSON.stringify(test[key])
      const inputValue = isString(input[key]) ? input[key] : JSON.stringify(input[key])
      if (testValue !== inputValue) {
        result = false
      }
    } else {
      result = false
    }
  }
  return result
}

/**
 * 匹配 rule 中的对应项
 * @param config 原请求配置项
 * @param test 匹配配置
 * @returns {{matchParams, matched: boolean}}
 */
export function doTest (config, test) {
  const { url, params = {}, data = {}, header = {}, method = 'GET' } = config
  const {
    url: tUrl = '',
    protocol: tProtocol = '',
    host: tHost = '',
    port: tPort = '',
    path: tPath = '',
    search: tSearch = '',
    params: tParams = {},
    data: tData = {},
    header: tHeader = {},
    method: tMethod = ''
  } = test

  const { baseUrl, protocol, hostname, port, path, search } = parseUrl(url)

  // 如果待匹配项为空，则认为匹配成功
  // url 匹配
  let urlMatched = false
  let matchParams = {}
  if (tUrl) {
    // 处理协议头
    const protocolReg = /^(?:\w+(\\)?:|(:\w+))\/\//

    const hasProtocol = protocolReg.exec(tUrl)

    let handledTUrl = tUrl

    if (hasProtocol) {
      if (!hasProtocol[1] && !hasProtocol[2]) {
        handledTUrl = tUrl.replace(':', '\\:')
      }
    } else {
      handledTUrl = (tUrl.startsWith('//') ? ':protocol' : ':protocol//') + tUrl
    }

    try {
      // 匹配结果参数
      const matcher = match(handledTUrl)
      const result = matcher(baseUrl)
      urlMatched = !!result
      matchParams = result.params
    } catch (error) {
      console.error('Test url 不符合规范，test url 中存在 : 或者 ? 等保留字符，请在前面添加 \\ 进行转义，如 https\\://baidu.com/xxx.')
    }
  } else {
    // protocol 匹配
    const protocolMatched = tProtocol ? tProtocol === protocol : true
    // host 匹配
    const hostMatched = tHost ? tHost === hostname : true
    // port 匹配
    const portMatched = tPort ? tPort === port : true
    // path 匹配
    const pathMatched = tPath ? tPath === path : true

    urlMatched = protocolMatched && hostMatched && portMatched && pathMatched
  }

  // search 匹配
  const searchMatched = tSearch ? search.includes(tSearch) : true
  // params 匹配
  const paramsMatched = isNotEmptyObject(tParams) ? attrMatch(tParams, params) : true
  // data 匹配
  const likeGet = /^GET|DELETE|HEAD$/i.test(method)
  const dataMatched = isNotEmptyObject(tData) ? attrMatch(tData, likeGet ? params : data) : true
  // header 匹配
  const headerMatched = isNotEmptyObject(tHeader) ? attrMatch(tHeader, header) : true
  // method 匹配
  let methodMatched = false
  if (isArray(tMethod)) {
    const tMethodUpper = tMethod.map((item) => {
      return item.toUpperCase()
    })
    methodMatched = isNotEmptyArray(tMethodUpper) ? tMethodUpper.indexOf(method) > -1 : true
  } else if (isString(tMethod)) {
    methodMatched = tMethod ? tMethod.toUpperCase() === method : true
  }

  // 是否匹配
  const matched = urlMatched && searchMatched && paramsMatched && dataMatched && headerMatched && methodMatched

  return {
    matched,
    matchParams
  }
}

export function sortObject (obj) {
  if (!isObject(obj)) return obj
  const newObj = {}
  Object.keys(obj).sort().forEach(key => {
    newObj[key] = obj[key]
  })
  return newObj
}

export function formatCacheKey (url) {
  if (typeof url !== 'string' || !url.includes('//')) return url
  return url.split('//')[1].split('?')[0]
}

export function checkCacheConfig (thisConfig, catchData) {
  return JSON.stringify(sortObject(thisConfig.data)) === JSON.stringify(catchData.data) &&
    JSON.stringify(sortObject(thisConfig.params)) === JSON.stringify(catchData.params) &&
    thisConfig.method === catchData.method
}
