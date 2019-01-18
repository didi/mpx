/**
 * stringify object to query string, started with '?'
 * @param obj queryObj
 * @return {string} queryString
 */
function stringifyQuery (obj) {
  const res = obj ? Object.keys(obj).sort().map(key => {
    const val = obj[key]

    if (val === undefined) {
      return ''
    }

    if (val === null) {
      return key
    }

    if (Array.isArray(val)) {
      const result = []
      val.slice().forEach(val2 => {
        if (val2 === undefined) {
          return
        }
        if (val2 === null) {
          result.push(key)
        } else {
          result.push(key + '=' + val2)
        }
      })
      return result.join('&')
    }

    return key + '=' + val
  }).filter(x => x.length > 0).join('&') : null
  return res ? `?${res}` : ''
}

/**
 * parse query string to Object. Query string must started with '?'
 * @param {string} query
 * @return {Object} parsed queryObj
 */
function parseQuery (query) {
  const res = {}

  query = query.trim().replace(/^(\?|#|&)/, '')

  if (!query) {
    return res
  }
  query.split('&').forEach(param => {
    const parts = param.replace(/\+/g, ' ').split('=')
    const key = parts.shift()
    const val = parts.length > 0 ? parts.join('=') : ''

    if (key === '') {
      return {}
    }
    if (res[key] === undefined) {
      res[key] = val
    } else if (Array.isArray(res[key])) {
      res[key].push(val)
    } else {
      res[key] = val
    }
  })

  return res
}

module.exports = {
  stringifyQuery,
  parseQuery
}
