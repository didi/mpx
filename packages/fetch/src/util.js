function type (a) {
  return Object.prototype.toString.call(a).slice(8, -1)
}

function isThenable (obj) {
  return obj && typeof obj.then === 'function'
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
  if (type(data) !== 'Object') {
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

export { parseUrl, buildUrl, filterUndefined, type, isThenable, getEnvObj }
