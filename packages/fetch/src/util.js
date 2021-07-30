const toString = Object.prototype.toString

// 是否为一个对象
function isObject (val) {
  return toString.call(val) === '[object Object]'
}

// 是否为一个数组
function isArray (val) {
  return toString.call(val) === '[object Array]'
}

// 是否为一个字符串
function isString (val) {
  return toString.call(val) === '[object String]'
}

// 是否为 Function
function isFunction (val) {
  return toString.call(val) === '[object Function]'
}

function isThenable (obj) {
  return obj && typeof obj.then === 'function'
}

// 不为空对象
function isNotEmptyObject (obj) {
  return obj && isObject(obj) && Object.keys(obj).length > 0
}

// 不为空数组
function isNotEmptyArray (ary) {
  return ary && isArray(ary) && ary.length > 0
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

function buildUrl (url, query) {
  if (!url) return ''
  const params = Object.keys(query)
    .map(item => `${encodeURIComponent(item)}=${encodeURIComponent(query[item])}`)
    .join('&')
  const flag = url.indexOf('?') > -1 ? '&' : '?'
  return `${url}${flag}${params}`
}

function filterUndefined (data) {
  if (!isObject(data)) {
    return data
  }
  data = Object.assign({}, data)
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) {
      delete data[key]
    } else if (data[key] === null) {
      data[key] = ''
    }
  })
  return data
}

// 解析拆分 url 参数
function parseURL (url) {
  const match = /^(.*?)(?:\?(.*?))?(?:#(.*?))?$/.exec(url)
  const [ fullUrl, baseUrl = '', search = '', hash = '' ] = match

  const u1 = baseUrl.split('//') // 分割出协议
  const protocolReg = /^http(s?):/
  const protocol = protocolReg.test(u1[0]) ? u1[0] : ''
  const u2 = u1[1] || u1[0] // 可能没有协议
  const host = u2.substring(u2.indexOf('/'), 0) // 分割出主机名和端口号
  const path = u2.substring(u2.indexOf('/')) // 分割出路径
  const hostname = host.split(':')[0]
  const port = host.split(':')[1] || ''

  // search 改为对象格式
  const query = {}
  search && search.split('&').forEach((item) => {
    const [ name, value ] = item.split('=')
    query[name] = decodeURIComponent(value)
  })
  return { fullUrl, baseUrl, protocol, hostname, port, host, path, query, hash }
}

function getEnvObj () {
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

export {
  parseUrl,
  buildUrl,
  filterUndefined,
  isObject,
  isArray,
  isString,
  isFunction,
  isThenable,
  isNotEmptyObject,
  isNotEmptyArray,
  parseURL,
  getEnvObj
}
