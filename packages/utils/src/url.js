import { isArray, type, forEach } from './base'

function encode (val) {
  return encodeURIComponent(val)
}

function decode (val) {
  return decodeURIComponent(val)
}

function isURLSearchParams (val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams
}

function serialize (params) {
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
      if (type(v) === 'Date') {
        v = v.toISOString()
      } else if (type(v) === 'Object') {
        v = JSON.stringify(v)
      }
      parts.push(encode(key) + '=' + encode(v))
    })
  })

  return parts.join('&')
}

function buildUrl (url, params = {}, serializer) {
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
function parseUrl (url) {
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

const specialValues = {
  null: null,
  true: true,
  false: false
}

function parseQuery (query) {
  if (query.slice(0, 1) !== '?') {
    throw new Error(
      "A valid query string passed to parseQuery should begin with '?'"
    )
  }

  query = query.slice(1)

  if (!query) {
    return {}
  }

  if (query.slice(0, 1) === '{' && query.slice(-1) === '}') {
    return JSON.parse(query)
  }

  const queryArgs = query.split(/[,&]/g)
  const result = Object.create(null)

  queryArgs.forEach((arg) => {
    const idx = arg.indexOf('=')

    if (idx >= 0) {
      let name = decode(arg.slice(0, idx))
      let value = decode(arg.slice(idx + 1))

      // eslint-disable-next-line no-prototype-builtins
      if (specialValues.hasOwnProperty(value)) {
        value = specialValues[value]
      }

      if (name.slice(-2) === '[]') {
        name = name.slice(0, name.length - 2)

        if (!Array.isArray(result[name])) {
          result[name] = []
        }

        result[name].push(value)
      } else {
        result[name] = value
      }
    } else {
      if (arg.slice(0, 1) === '-') {
        result[decode(arg.slice(1))] = false
      } else if (arg.slice(0, 1) === '+') {
        result[decode(arg.slice(1))] = true
      } else {
        result[decode(arg)] = true
      }
    }
  })

  return result
}

function parseUrlQuery (url) {
  let path = url
  let query = ''
  const queryIndex = url.indexOf('?')
  if (queryIndex >= 0) {
    path = url.slice(0, queryIndex)
    query = url.slice(queryIndex)
  }
  const queryObj = parseQuery(query || '?')
  return {
    path,
    queryObj
  }
}

export {
  buildUrl,
  parseUrl,
  parseQuery,
  parseUrlQuery,
  serialize
}
