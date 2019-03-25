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

module.exports = stringifyQuery
